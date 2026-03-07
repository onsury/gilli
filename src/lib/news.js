// src/lib/news.js
// Fetch Gully news from Firestore by pincode — for WhatsApp delivery

import { db } from "./firebase.js";

/**
 * Fetch today's news for a specific pincode
 * Returns formatted WhatsApp message string
 */
export async function getNewsForPincode(pincode) {
  if (!db) return null;

  try {
    // Query feed collection for items matching this pincode
    const snapshot = await db
      .collection("feed")
      .where("pincodes", "array-contains", pincode)
      .orderBy("homepage_score", "desc")
      .limit(7)
      .get();

    if (snapshot.empty) {
      // Try without pincode filter — return general Chennai news
      const generalSnap = await db
        .collection("feed")
        .orderBy("homepage_score", "desc")
        .limit(5)
        .get();

      if (generalSnap.empty) return null;

      return formatNewsDigest(
        generalSnap.docs.map(d => d.data()),
        "Chennai",
        false
      );
    }

    const items = snapshot.docs.map(d => d.data());
    const areaName = items[0]?.area || `Chennai ${pincode}`;
    return formatNewsDigest(items, areaName, true);

  } catch (err) {
    console.error("[news.js] Firestore error:", err);
    return null;
  }
}

/**
 * Format news items into a clean WhatsApp digest
 */
function formatNewsDigest(items, areaName, isPincodeSpecific) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long"
  });

  let msg = `📰 *Gully News — ${areaName}*\n`;
  msg += `_${today}_\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n\n`;

  items.forEach((item, i) => {
    // Category emoji
    const emoji = {
      temple: "🛕", food: "🍱", safety: "🚨", business: "💼",
      education: "🎓", politics: "🏛️", culture: "🎭", sports: "🏏",
      health: "🏥", tech: "💻", cinema: "🎬"
    }[item.category] || "📌";

    // Breaking / urgent badge
    let badge = "";
    if (item.breaking) badge = "🔴 BREAKING — ";
    else if (item.urgent) badge = "⚠️ ALERT — ";
    else if (item.templeOfDay) badge = "🛕 Temple of the Day — ";
    else if (item.gilliDeal) badge = "🏏 Gilli Deal — ";

    msg += `*${i + 1}. ${badge}${item.title}*\n`;
    msg += `${item.summary}\n`;
    msg += `_${item.source} · ${item.publishedAt}_\n\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━\n`;

  if (isPincodeSpecific) {
    msg += `📍 News for your pincode\n`;
    msg += `🔄 Reply *news* for refresh\n`;
    msg += `🏙️ Reply *chennai news* for all Chennai\n`;
  } else {
    msg += `🔄 Reply *news [pincode]* for your area\n`;
    msg += `   Example: *news 600004*\n`;
  }

  msg += `\n🛒 *Gilli* — Your neighbourhood. Your news.`;
  return msg;
}

/**
 * Get all available Chennai pincodes from feed
 * Useful for showing user what's covered
 */
export async function getCoveredPincodes() {
  if (!db) return [];
  try {
    const snap = await db
      .collection("feed")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const pincodes = new Set();
    snap.docs.forEach(d => {
      const item = d.data();
      if (item.pincodes) item.pincodes.forEach(p => pincodes.add(p));
    });
    return Array.from(pincodes).sort();
  } catch (e) {
    return [];
  }
}