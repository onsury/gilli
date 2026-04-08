// src/lib/news-generator.js
// AI-powered hyperlocal news generator — Claude API with web research
// Runs every 6 hours across all Chennai pincodes

import Anthropic from "@anthropic-ai/sdk";
import { db } from "./firebase.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Complete Chennai pincode map with landmarks
const PINCODE_AREAS = {
  "600001": { name: "Chennai Central / Parrys / George Town", areas: ["Parrys", "George Town", "Mannady", "Mint", "Flower Bazaar", "Sowcarpet", "Govt Stanley Hospital"] },
  "600002": { name: "Anna Road / Chintadripet", areas: ["Anna Road", "Chintadripet", "Pudupet", "Madras Electricity System"] },
  "600003": { name: "Park Town / Edapalayam", areas: ["Park Town", "Edapalayam", "Madras Medical College", "Ripon Buildings", "Dr Ambedkar Nagar"] },
  "600004": { name: "Mylapore / Mandaveli / Santhome", areas: ["Mylapore", "Mandaveli", "Santhome", "Royapettah High Road", "Vivekananda College", "Kapaleeshwarar Temple"] },
  "600005": { name: "Chepauk / Triplicane", areas: ["Chepauk", "Triplicane", "Madras University", "Parthasarathy Koil", "Tiruvallikkeni"] },
  "600006": { name: "Greams Road / Teynampet West", areas: ["Greams Road", "Teynampet West", "Shastri Bhavan", "DPI"] },
  "600007": { name: "Vepery", areas: ["Vepery", "Poonamallee High Road"] },
  "600008": { name: "Egmore", areas: ["Egmore", "Ethiraj Salai", "Pantheon Road"] },
  "600009": { name: "Fort St George", areas: ["Fort St George", "Rajaji Salai"] },
  "600010": { name: "Kilpauk", areas: ["Kilpauk", "Kilpauk Medical College", "New Avadi Road"] },
  "600011": { name: "Perambur / Sembiam", areas: ["Perambur", "Sembiam", "Perambur North"] },
  "600012": { name: "Perambur Barracks / Puliyanthope", areas: ["Perambur Barracks", "Puliyanthope", "Venkatesapuram", "Kosapet", "Strahans Road"] },
  "600013": { name: "Rayapuram / Royapuram", areas: ["Rayapuram", "Royapuram Market", "Kalmandapam"] },
  "600014": { name: "Royapettah / Triplicane South", areas: ["Royapettah", "Lloyds Estate", "Jam Bazaar", "Pudupakkam", "Gaudiyamath Road"] },
  "600015": { name: "Saidapet / Guindy North", areas: ["Saidapet", "Guindy North", "Saidapet North", "Saidapet West"] },
  "600016": { name: "Chennai Airport / Meenambakkam", areas: ["Chennai Airport", "Meenambakkam", "St Thomas Mount", "Alandur"] },
  "600017": { name: "T Nagar / Thyagaraya Nagar", areas: ["T Nagar", "Pondy Bazaar", "Usman Road", "Hindi Prachar Sabha", "Thyagaraya Nagar North", "Thyagaraya Nagar South"] },
  "600018": { name: "Teynampet / Abiramapuram", areas: ["Teynampet", "Abiramapuram", "Chamiers Road", "Eldams Road", "Pr Accountant General"] },
  "600019": { name: "Tiruvottiyur", areas: ["Tiruvottiyur"] },
  "600020": { name: "Adyar / Indira Nagar", areas: ["Adyar", "Indira Nagar", "Shastri Nagar", "Kasturibai Nagar", "Theosophical Society", "Central Leather Research"] },
  "600021": { name: "Washermanpet / Cemetry Road", areas: ["Washermanpet", "Washermanpet East", "Korrukupet", "Golluvar Agraharam"] },
  "600022": { name: "Rajbhavan / Raj Bhavan", areas: ["Raj Bhavan", "Rajbhavan"] },
  "600023": { name: "Aynavaram", areas: ["Aynavaram"] },
  "600024": { name: "Kodambakkam / Rangarajapuram", areas: ["Kodambakkam", "Rangarajapuram", "KDM West"] },
  "600025": { name: "Engineering College / Directorate", areas: ["Engineering College", "Directorate of Technical Education"] },
  "600026": { name: "Vadapalani", areas: ["Vadapalani", "Vadapalani Bus Terminus"] },
  "600028": { name: "RA Puram / Santhome / Mandaveli / Foreshore Estate", areas: ["Raja Annamalaipuram", "RA Puram", "Ramakrishna Nagar", "Foreshore Estate", "Boat Club Road"] },
  "600029": { name: "Aminjikarai", areas: ["Aminjikarai"] },
  "600030": { name: "Shenoy Nagar / Aminjikarai", areas: ["Shenoy Nagar", "Aminjikarai", "PC Hostel"] },
  "600031": { name: "Chetput / World University", areas: ["Chetput", "World University Centre"] },
  "600032": { name: "Guindy / Ekkaduthangal", areas: ["Guindy Industrial Estate", "Ekkaduthangal", "Chennai Race Course", "Defence Officers Colony"] },
  "600033": { name: "West Mambalam / Mambalam", areas: ["West Mambalam", "Mambalam RS", "Kumaran Nagar", "Mettupalayam"] },
  "600034": { name: "Nungambakkam", areas: ["Nungambakkam", "Nungambakkam High Road", "Loyola College", "Nungambakkam Bazaar"] },
  "600035": { name: "Nandanam", areas: ["Nandanam"] },
  "600036": { name: "IIT Madras", areas: ["Indian Institute of Technology", "IIT Madras"] },
  "600037": { name: "Mogappair", areas: ["Mogappair", "Mogappair East", "Mogappair West"] },
  "600038": { name: "ICF Colony", areas: ["ICF Colony", "Integral Coach Factory"] },
  "600039": { name: "Vyasarpadi / Vyasar Nagar", areas: ["Vyasarpadi", "Vyasar Nagar Colony"] },
  "600040": { name: "Anna Nagar", areas: ["Anna Nagar", "Anna Nagar East", "Anna Nagar West", "Anna Nagar Tower Park"] },
  "600041": { name: "Tiruvanmiyur / Palavakkam", areas: ["Tiruvanmiyur", "Palavakkam", "Valmiki Nagar", "Tiruvanmiyur North"] },
  "600042": { name: "Velachery", areas: ["Velachery", "Velachery Main Road"] },
  "600049": { name: "Villivakkam", areas: ["Villivakkam", "Srinivasanagar", "Rajajinagar"] },
  "600050": { name: "Padi", areas: ["Padi"] },
  "600051": { name: "Madhavaram Milk Colony", areas: ["Madhavaram Milk Colony"] },
  "600053": { name: "Ambattur", areas: ["Ambattur"] },
  "600058": { name: "Ambattur Industrial Estate", areas: ["Ambattur Industrial Estate", "SIDCO"] },
  "600060": { name: "Madhavaram", areas: ["Madhavaram", "Vadaperumbakkam"] },
  "600061": { name: "Nanganallur / Pazhavanthangal", areas: ["Nanganallur", "Pazhavanthangal"] },
  "600076": { name: "Korattur", areas: ["Korattur", "Korattur RS"] },
  "600078": { name: "KK Nagar / Kalaignar Karunanidhi Nagar", areas: ["KK Nagar", "Kalaignar Karunanidhi Nagar"] },
  "600081": { name: "Tondiarpet", areas: ["Tondiarpet", "Tondiarpet Bazaar", "Tondiarpet West"] },
  "600082": { name: "Agaram / GKM Colony", areas: ["Agaram", "GKM Colony", "Jawahar Nagar", "Rajathottam", "Periyar Nagar"] },
  "600083": { name: "Ashok Nagar / Jafferkhanpet", areas: ["Ashok Nagar", "Jafferkhanpet"] },
  "600084": { name: "Purasawalkam / Flowers Road", areas: ["Purasawalkam", "Flowers Road"] },
  "600085": { name: "Kotturpuram", areas: ["Kotturpuram"] },
  "600086": { name: "Gopalapuram", areas: ["Gopalapuram"] },
  "600087": { name: "Valasaravakkam / Alwarthirunagar", areas: ["Valasaravakkam", "Alwarthirunagar"] },
  "600088": { name: "Adambakkam / Nilamangai Nagar", areas: ["Adambakkam", "Nilamangai Nagar"] },
  "600089": { name: "Ramapuram", areas: ["Ramapuram"] },
  "600090": { name: "Besant Nagar / Rajaji Bhavan", areas: ["Besant Nagar", "Rajaji Bhavan", "Elliot's Beach"] },
  "600091": { name: "Madipakkam", areas: ["Madipakkam", "Madipakkam South", "Ram Nagar"] },
  "600092": { name: "Virugambakkam / Koyambedu Market", areas: ["Virugambakkam", "Koyambedu Wholesale Market", "Sri Ayyappa Nagar"] },
  "600093": { name: "Saligramam", areas: ["Saligramam"] },
  "600094": { name: "Choolaimedu", areas: ["Choolaimedu"] },
  "600095": { name: "Maduravoyal", areas: ["Maduravoyal"] },
  "600096": { name: "Perungudi", areas: ["Perungudi"] },
  "600097": { name: "Karapakkam / Sholinganallur", areas: ["Karapakkam", "Oggiamthoraipakkam"] },
  "600099": { name: "Kolathur", areas: ["Kolathur", "Lakshmipuram"] },
  "600101": { name: "Anna Nagar Western Extension", areas: ["Anna Nagar Western Extension"] },
  "600102": { name: "Anna Nagar East", areas: ["Anna Nagar East"] },
  "600106": { name: "Arumbakkam / DG Vaishnav", areas: ["Arumbakkam", "Arumbakkam North", "DG Vaishnav College"] },
  "600107": { name: "Koyambedu / Nerkundram", areas: ["Koyambedu", "Nerkundram", "Koyambedu Bus Terminus"] },
  "600113": { name: "Taramani / Tidel Park", areas: ["Taramani", "Tidel Park", "TTTI", "Central Institute of Technology"] },
  "600115": { name: "Injambakkam / Neelangarai", areas: ["Injambakkam", "Neelangarai"] },
  "600116": { name: "Porur / Alapakkam", areas: ["Porur", "Alapakkam"] },
  "600118": { name: "Kodungaiyur / Erukkancheri", areas: ["Kodungaiyur", "Erukkancheri", "RV Nagar"] },
  "600119": { name: "Sholinganallur", areas: ["Sholinganallur", "OMR"] },
  "600125": { name: "Mugalivakkam / Manapakkam", areas: ["Mugalivakkam", "Manapakkam"] },
};

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

export { PINCODE_AREAS, PILOT_PINCODES };