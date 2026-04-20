// src/lib/news-generator.js
// AI-powered hyperlocal news generator — Claude API with web research
// Runs every 6 hours across all Chennai pincodes

import Anthropic from "@anthropic-ai/sdk";
import { PINCODE_AREAS } from './chennai-pincodes.js';
import { db } from "./firebase.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Complete Chennai pincode map with landmarks

// Pilot pincodes for Phase 1
const PILOT_PINCODES = ["600028", "600040", "600017", "600001", "600004"];

async function researchAndGenerateNews(pincode, areaInfo) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const hour = new Date().getHours();
  const timeSlot = hour < 6 ? "early morning" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";

  const prompt = `You are Gully News, Chennai's hyperlocal neighbourhood news AI for ${areaInfo.name} (pincode ${pincode}).

Today is ${today}, ${timeSlot} edition.

Generate 5 hyperlocal news items specific to ${areaInfo.name}.

Key localities: ${areaInfo.areas.join(", ")}

News must be:
- Genuinely hyperlocal — specific streets, local temples, markets, schools, landmarks in this exact area
- Mix: 1 temple/culture, 1 civic/infrastructure, 1 food/business, 1 community/event, 1 safety/alert
- Chennai-specific context — weather, festivals, local governance, CMRL metro updates if relevant
- Written like a trusted neighbourhood newsletter
- Practical and useful for residents

Current Chennai context to weave in naturally:
- Summer heat (March-April) affects daily life
- Corporation (GCC) ward-level civic issues
- Auto and bus connectivity
- Local market prices and availability
- School exam season (March-April)

Return ONLY a valid JSON array with exactly 5 objects:
[
  {
    "title": "Headline under 12 words",
    "summary": "2-3 sentences with specific local details and actionable information",
    "category": "temple|food|safety|business|education|culture|health|civic",
    "source": "Gully ${areaInfo.name} Desk",
    "breaking": false,
    "urgent": false,
    "templeOfDay": false,
    "gilliDeal": false,
    "homepage_score": 75,
    "pincodes": ["${pincode}"],
    "area": "${areaInfo.name}"
  }
]

Rules:
- Set templeOfDay: true for exactly one temple item
- Set homepage_score 85-100 for breaking/urgent news, 65-85 for regular news
- Return pure JSON array only — no markdown, no explanation`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.trim();
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

export async function generateDailyNews(pincodeFilter = null) {
  if (!db) {
    console.error("[news-generator] Firestore not available");
    return {};
  }

  const targetPincodes = pincodeFilter
    ? [pincodeFilter]
    : PILOT_PINCODES;

  console.log(`[news-generator] Generating news for ${targetPincodes.length} pincodes...`);
  const results = {};
  const now = new Date();
  const publishedAt = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  for (const pincode of targetPincodes) {
    const areaInfo = PINCODE_AREAS[pincode];
    if (!areaInfo) continue;

    console.log(`[news-generator] ${pincode} — ${areaInfo.name}`);

    try {
      // Delete old AI-generated news for this pincode
      const oldSnap = await db.collection("feed")
        .where("pincodes", "array-contains", pincode)
        .where("generatedBy", "==", "claude-ai")
        .get();

      if (!oldSnap.empty) {
        const delBatch = db.batch();
        oldSnap.docs.forEach(doc => delBatch.delete(doc.ref));
        await delBatch.commit();
      }

      // Generate new news
      const items = await researchAndGenerateNews(pincode, areaInfo);

      // Save to Firestore
      const batch = db.batch();
      items.forEach(item => {
        const ref = db.collection("feed").doc();
        batch.set(ref, {
          ...item,
          publishedAt,
          createdAt: now,
          generatedBy: "claude-ai",
          pincode,
        });
      });
      await batch.commit();

      results[pincode] = {
        area: areaInfo.name,
        count: items.length,
      };

      console.log(`[news-generator] Saved ${items.length} items for ${pincode}`);

    } catch (err) {
      console.error(`[news-generator] Error for ${pincode}:`, err.message);
      results[pincode] = { error: err.message };
    }

    // 2 second delay between pincodes
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("[news-generator] Complete:", results);
  return results;
}

export { PILOT_PINCODES };
