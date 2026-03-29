// src/lib/news-generator.js
import Anthropic from "@anthropic-ai/sdk";
import { db } from "./firebase.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PINCODE_AREAS = {
  "600028": { name: "RA Puram / Santhome / Mandaveli", areas: ["RA Puram", "Santhome", "Mandaveli", "Foreshore Estate"] },
  "600040": { name: "Anna Nagar", areas: ["Anna Nagar East", "Anna Nagar West", "Anna Nagar Tower"] },
  "600017": { name: "T Nagar", areas: ["T Nagar", "Pondy Bazaar", "Usman Road"] },
  "600001": { name: "Parrys / George Town", areas: ["Parrys", "George Town", "NSC Bose Road"] },
  "600004": { name: "Mylapore", areas: ["Mylapore", "Alwarpet", "R.K. Mutt Road"] },
};

async function generateNewsForPincode(pincode) {
  const area = PINCODE_AREAS[pincode];
  if (!area) return [];

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const prompt = `You are Gully News, a hyperlocal neighbourhood news generator for Chennai, India.

Generate 5 realistic, specific neighbourhood news items for ${area.name} (pincode ${pincode}), Chennai for ${today}.

Areas covered: ${area.areas.join(", ")}

Requirements:
- Each news item must be hyperlocal and specific to streets, landmarks, temples, markets in this exact neighbourhood
- Mix of categories: civic issues, temple events, food, safety, business openings, community events
- Write in a friendly neighbourhood newsletter tone
- Mention actual streets and local landmarks
- One item about a temple or cultural event
- One item about a local business or food
- One item about a civic or infrastructure update

Return ONLY a JSON array with exactly 5 items, each with these fields:
{
  "title": "Short headline max 10 words",
  "summary": "2-3 sentence summary with specific local details",
  "category": "one of: temple/food/safety/business/education/culture/health/civic",
  "source": "Gully ${area.name} Desk",
  "breaking": false,
  "urgent": false,
  "templeOfDay": false,
  "gilliDeal": false,
  "homepage_score": 75,
  "pincodes": ["${pincode}"],
  "area": "${area.name}"
}

Set templeOfDay true for the temple item. Return pure JSON array only.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].text.trim();
    const items = JSON.parse(text);
    const now = new Date();
    const publishedAt = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    return items.map(item => ({
      ...item,
      publishedAt,
      createdAt: now,
      generatedBy: "claude-ai",
      pincode,
    }));
  } catch (err) {
    console.error(`[news-generator] Error for ${pincode}:`, err.message);
    return [];
  }
}

export async function generateDailyNews() {
  if (!db) return;
  console.log("[news-generator] Starting daily news generation...");
  const results = {};

  for (const [pincode, area] of Object.entries(PINCODE_AREAS)) {
    console.log(`[news-generator] Generating for ${area.name}...`);

    try {
      const oldSnap = await db.collection("feed")
        .where("pincodes", "array-contains", pincode)
        .where("generatedBy", "==", "claude-ai")
        .get();
      const deleteBatch = db.batch();
      oldSnap.docs.forEach(doc => deleteBatch.delete(doc.ref));
      await deleteBatch.commit();
    } catch (e) {}

    const items = await generateNewsForPincode(pincode);

    if (items.length > 0) {
      const batch = db.batch();
      items.forEach(item => {
        const ref = db.collection("feed").doc();
        batch.set(ref, item);
      });
      await batch.commit();
      results[pincode] = items.length;
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("[news-generator] Complete:", results);
  return results;
}