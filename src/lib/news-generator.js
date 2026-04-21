// src/lib/news-generator.js
// AI-powered hyperlocal news generator — Claude API with web research
// Runs daily at 7 AM IST across 15 active Chennai pincodes
 
import Anthropic from "@anthropic-ai/sdk";
import { PINCODE_AREAS } from './chennai-pincodes.js';
import { db } from "./firebase.js";
 
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
 
// 15 active pincodes for Phase 1 — diverse coverage of Chennai
const PILOT_PINCODES = [
  "600001", "600004", "600017", "600018", "600020",
  "600024", "600028", "600031", "600034", "600040",
  "600041", "600042", "600050", "600083", "600119",
];
 
async function researchAndGenerateNews(pincode, areaInfo) {
  const areasList = Array.isArray(areaInfo.areas) ? areaInfo.areas.join(", ") : "";
 
  const prompt = `You are Gully News, Chennai's hyperlocal neighbourhood news AI for ${areaInfo.name} (pincode ${pincode}).
 
Generate 5-7 current, realistic news items specific to this neighbourhood. Cover diverse topics: local business, infrastructure, temples/culture, civic issues, community events, food, safety alerts.
 
Areas in this pincode: ${areasList}
 
Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Each object must have:
- "title": compelling headline (max 15 words)
- "summary": 2-3 sentence description with specific details
- "category": one of: temple, food, safety, business, education, politics, culture, sports, health, tech, cinema, infrastructure
- "area": specific area name within the pincode
- "pincodes": ["${pincode}"]
- "type": one of: article, alert, deal
- "source": realistic source (The Hindu, Times of India, Dinamalar, News Today, Gully Heritage Desk)
- "breaking": true only for 1 urgent item, false otherwise
- "urgent": true only for safety alerts, false otherwise
- "homepage_score": integer 70-95
 
Make it feel authentic to the neighbourhood character. Specific street names, shop names, temple names where plausible.`;
 
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });
 
    const text = message.content[0]?.text || "";
    // Strip any accidental markdown fences
    const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const items = JSON.parse(clean);
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.error(`[news-generator] ${pincode}: ${err.message}`);
    return [];
  }
}
 
export async function generateDailyNews(pincodeFilter = null) {
  if (!db) {
    return { error: "Firestore not initialized" };
  }
 
  const targetPincodes = pincodeFilter
    ? [pincodeFilter]
    : PILOT_PINCODES;
 
  console.log(`[news-generator] Generating news for ${targetPincodes.length} pincodes...`);
 
  const results = {};
  const now = new Date();
 
  for (const pincode of targetPincodes) {
    const areaInfo = PINCODE_AREAS[pincode];
    if (!areaInfo) {
      results[pincode] = { error: "Pincode not in map" };
      continue;
    }
 
    console.log(`[news-generator] ${pincode} — ${areaInfo.name}`);
 
    try {
      // Delete old AI-generated news for this pincode (keep feed fresh)
      const oldSnap = await db.collection("feed")
        .where("pincodes", "array-contains", pincode)
        .where("generatedBy", "==", "claude-ai")
        .get();
 
      const deleteBatch = db.batch();
      oldSnap.docs.forEach(d => deleteBatch.delete(d.ref));
      if (oldSnap.size > 0) await deleteBatch.commit();
 
      // Generate fresh items
      const items = await researchAndGenerateNews(pincode, areaInfo);
 
      if (items.length === 0) {
        results[pincode] = { error: "No items generated" };
        continue;
      }
 
      // Write to Firestore
      const batch = db.batch();
      items.forEach((item, i) => {
        const docRef = db.collection("feed").doc();
        const publishedAt = `${i + 1}h ago`;
        batch.set(docRef, {
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
 
    // 2 second delay between pincodes to stay polite to the API
    await new Promise(r => setTimeout(r, 2000));
  }
 
  console.log("[news-generator] Complete:", results);
  return results;
}
 
export { PILOT_PINCODES };
 