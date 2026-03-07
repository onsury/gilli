// src/lib/handlers/router.js
// The BRAIN of Gilli — v3 COMPLETE with Shopfront, Billboard, Loudspeaker
// Billing integration, ordering, bill generation, broadcasts

import {
  getSession, updateSession, deleteSession,
  getShop, createShop, updateShop,
  getShopsByArea, getActiveShops, getShopProducts,
  createOrUpdateCustomer, getCustomersForShop, getCustomersInArea,
  createOrder, getShopOrdersToday, updateOrder,
  saveDailySpecial, getDailySpecialsForArea,
  db, FieldValue,
} from "../firebase.js";
import { sendTextMessage, sendButtonMessage, markAsRead, downloadMedia } from "../whatsapp.js";
import { generateBill, generateOrderSummary } from "../billing/bill-generator.js";
import { parseUploadedFile, buildCatalogText } from "../parsers/excel-parser.js";
import { getNewsForPincode, getCoveredPincodes } from "../news.js";

// ========================================================================
// MAIN ROUTER
// ========================================================================
export async function routeMessage(senderPhone, message) {
  let session = await getSession(senderPhone);
  const text = extractText(message);
  const type = message.type;

  console.log(`[${senderPhone}] State:${session?.state || "NEW"} Type:${type} Text:${text.substring(0, 50)}`);

  // ---- New user ----
  if (!session) {
    if (message.id) await markAsRead(message.id);
    await sendWelcome(senderPhone);
    await updateSession(senderPhone, { state: "AWAITING_ROLE", role: null, onboarding: {} });
    return;
  }
// ---- NEWS commands ----
  // Detect: "news", "news 600004", "600004", "gully news"
  const isNewsCmd = tl === "news" ||
    tl === "gully news" ||
    tl === "today's news" ||
    tl === "todays news" ||
    tl.startsWith("news ") ||
    /^6000\d{2}$/.test(tl.trim());  // bare 6-digit Chennai pincode

  if (isNewsCmd) {
    if (message.id) await markAsRead(message.id);

    // Extract pincode from message if present
    const pincodeMatch = text.match(/6000\d{2}/);
    const pincode = pincodeMatch ? pincodeMatch[0] : null;

    // If no pincode — check if we have one stored from session
    const storedPincode = session?.lastPincode || null;
    const targetPincode = pincode || storedPincode;

    if (!targetPincode) {
      // Ask for pincode
      const covered = await getCoveredPincodes();
      let msg = "📰 *Gully News*\n\nSend your Chennai pincode to get your neighbourhood news.\n\n";
      if (covered.length > 0) {
        msg += `*Areas covered today:*\n`;
        msg += covered.slice(0, 10).join(" · ");
        if (covered.length > 10) msg += ` ...+${covered.length - 10} more`;
        msg += "\n\nExample: Reply *600004* for Mylapore news";
      }
      await sendTextMessage(senderPhone, msg);
      return;
    }

    // Save pincode to session for future
    if (pincode && session) {
      await updateSession(senderPhone, { lastPincode: pincode });
    }

    // Fetch and send news
    await sendTextMessage(senderPhone, `📰 Fetching Gully News for ${targetPincode}...`);
    const newsMsg = await getNewsForPincode(targetPincode);

    if (newsMsg) {
      await sendTextMessage(senderPhone, newsMsg);
    } else {
      await sendTextMessage(senderPhone,
        `📰 No news found for ${targetPincode} right now.\n\nTry *chennai news* for general Chennai updates, or check back in a few hours.\n\nNews refreshes every 24 hours.`
      );
    }
    return;
  }
  if (message.id) await markAsRead(message.id);

  // ---- Global commands ----
  const tl = text.toLowerCase();
  if (tl === "reset" || tl === "start over" || tl === "restart") {
    await deleteSession(senderPhone);
    await sendWelcome(senderPhone);
    await updateSession(senderPhone, { state: "AWAITING_ROLE", role: null, onboarding: {} });
    return;
  }

  // ---- Route by state ----
  try {
    switch (session.state) {
      case "AWAITING_ROLE": await handleRole(senderPhone, text, session); break;

      // Shop onboarding
      case "SHOP_NAME": await onboardName(senderPhone, text, session); break;
      case "SHOP_AREA": await onboardArea(senderPhone, text, session); break;
      case "SHOP_CATEGORY": await onboardCategory(senderPhone, text, session); break;
      case "SHOP_UPI": await onboardUpi(senderPhone, text, session); break;
      case "SHOP_LOCATION": await onboardLocation(senderPhone, message, type, session); break;
      case "SHOP_BILLING": await onboardBilling(senderPhone, text, session); break;
      case "SHOP_CATALOG": await onboardCatalog(senderPhone, message, text, type, session); break;

      // Shop active
      case "SHOP_ACTIVE": await shopActive(senderPhone, message, text, type, session); break;

      // Customer
      case "CUSTOMER_ACTIVE": await customerActive(senderPhone, message, text, type, session); break;
      case "CUSTOMER_VIEWING_SHOP": await customerViewShop(senderPhone, message, text, type, session); break;
      case "CUSTOMER_ORDERING": await customerOrdering(senderPhone, text, session); break;
      case "CUSTOMER_CONFIRM_ORDER": await customerConfirmOrder(senderPhone, text, session); break;

      default:
        await sendTextMessage(senderPhone, "Something went wrong. Type *reset* to start over.");
    }
  } catch (err) {
    console.error(`[${senderPhone}] Error:`, err);
    await sendTextMessage(senderPhone, "Oops! Something went wrong. Please try again or type *reset*.");
  }
}

// ========================================================================
// HELPERS
// ========================================================================
function extractText(msg) {
  if (msg.type === "text") return msg.text?.body?.trim() || "";
  if (msg.type === "interactive") {
    if (msg.interactive?.button_reply) return msg.interactive.button_reply.id;
    if (msg.interactive?.list_reply) return msg.interactive.list_reply.id;
  }
  if (msg.type === "location") return "__LOC__";
  if (msg.type === "audio") return "__AUD__";
  if (msg.type === "image") return "__IMG__";
  if (msg.type === "document") return "__DOC__";
  return "";
}

async function sendWelcome(phone) {
  await sendButtonMessage(phone,
    "🛒 Gilli-க்கு வணக்கம்!\nWelcome to Gilli!\n\nசின்ன கடை. சரியான அடி.\nSmall shop. Precise strike.\n\nAre you a shop owner or a customer?",
    [{ id: "role_shop", title: "🏪 Shop Owner" }, { id: "role_customer", title: "🛍️ Customer" }]
  );
}

function calcDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ========================================================================
// ROLE SELECTION
// ========================================================================
async function handleRole(phone, text, session) {
  const t = text.toLowerCase();
  if (t === "role_shop" || t.includes("shop") || t.includes("kadai") || t.includes("கடை") || t.includes("owner") || t.includes("seller")) {
    const existing = await getShop(phone);
    if (existing) {
      await sendTextMessage(phone, `Welcome back! *${existing.name}* is active ✅\n\n📎 Send updated catalog (Excel/CSV)\n📸 Send price board photo\n✍️ Text updates\n💰 "my orders"\n📢 "broadcast: [message]" to announce`);
      await updateSession(phone, { state: "SHOP_ACTIVE", role: "shop", onboarding: {} });
      return;
    }
    await sendTextMessage(phone, "Let's set up your shop! Takes 5 minutes.\n\nWhat's your shop name?\nஉங்கள் கடையின் பெயர் என்ன?");
    await updateSession(phone, { state: "SHOP_NAME", role: "shop", onboarding: {} });
  } else if (t === "role_customer" || t.includes("customer") || t.includes("buy") || t.includes("வாங்க")) {
    await sendTextMessage(phone, "Welcome! 🛍️\n\n📍 Share your location → nearby shops\n✍️ Type area name (Mylapore, T Nagar)\n🔍 Type what you need (curd, rice)\n📢 Type *what's new* → today's specials");
    await updateSession(phone, { state: "CUSTOMER_ACTIVE", role: "customer" });
    await createOrUpdateCustomer(phone, { joinedAt: new Date() });
  } else {
    await sendButtonMessage(phone, "Please select — shop owner or customer?",
      [{ id: "role_shop", title: "🏪 Shop Owner" }, { id: "role_customer", title: "🛍️ Customer" }]);
  }
}

// ========================================================================
// SHOP ONBOARDING — Steps 1-7
// ========================================================================
async function onboardName(phone, text, session) {
  if (!text || text.length < 2 || text.startsWith("__")) {
    await sendTextMessage(phone, "Please type your shop name."); return;
  }
  const ob = { ...session.onboarding, shopName: text };
  await updateSession(phone, { state: "SHOP_AREA", onboarding: ob });
  await sendTextMessage(phone, `*${text}* 👍\n\nWhich area? Street or area name.\nஎந்த ஏரியா?`);
}

async function onboardArea(phone, text, session) {
  if (!text || text.length < 2 || text.startsWith("__")) {
    await sendTextMessage(phone, "Please tell me your shop's area."); return;
  }
  const ob = { ...session.onboarding, shopArea: text };
  await updateSession(phone, { state: "SHOP_CATEGORY", onboarding: ob });
  await sendButtonMessage(phone, `📍 ${text}. What do you sell?`,
    [{ id: "cat_grocery", title: "🛒 Grocery" }, { id: "cat_veg", title: "🥬 Vegetables" }, { id: "cat_other", title: "🏪 Other" }]);
}

async function onboardCategory(phone, text, session) {
  const t = text.toLowerCase();
  let cat = text;
  if (t === "cat_grocery" || t.includes("grocery") || t.includes("provision") || t.includes("kirana")) cat = "grocery";
  else if (t === "cat_veg" || t.includes("veg") || t.includes("fruit")) cat = "vegetables";
  else if (t.includes("pharmacy") || t.includes("medical")) cat = "pharmacy";
  else if (t.includes("bakery") || t.includes("sweet")) cat = "bakery";
  else if (t.includes("meat") || t.includes("fish") || t.includes("chicken")) cat = "meat_fish";
  else if (t.includes("dairy") || t.includes("milk")) cat = "dairy";
  else if (t.includes("flower") || t.includes("பூ")) cat = "flowers";
  else if (t === "cat_other") cat = "other";
  const ob = { ...session.onboarding, shopCategory: cat };
  await updateSession(phone, { state: "SHOP_UPI", onboarding: ob });
  await sendTextMessage(phone, "UPI ID for payments?\n(Example: shopname@upi or 98765xxxxx@paytm)");
}

async function onboardUpi(phone, text, session) {
  if (!text || text.startsWith("__") || (!text.includes("@") && !/^\d{10,}/.test(text))) {
    await sendTextMessage(phone, "Please send a valid UPI ID.\nExample: yourname@upi"); return;
  }
  const ob = { ...session.onboarding, shopUpi: text };
  await updateSession(phone, { state: "SHOP_LOCATION", onboarding: ob });
  await sendTextMessage(phone, "📍 Share your shop's location.\nTap 📎 → Location → Send.\n\nOr type *skip*.");
}

async function onboardLocation(phone, message, type, session) {
  let ob = { ...session.onboarding };
  if (type === "location" && message.location) {
    ob.latitude = message.location.latitude;
    ob.longitude = message.location.longitude;
  } else {
    const t = message.text?.body?.trim() || "";
    if (t.toLowerCase() === "skip") { /* no location */ }
    else if (t.includes("maps.google") || t.includes("goo.gl") || t.includes("maps.app")) { ob.locationLink = t; }
    else { await sendTextMessage(phone, "Share location using 📎 → Location.\nOr type *skip*."); return; }
  }
  await updateSession(phone, { state: "SHOP_BILLING", onboarding: ob });
  await sendTextMessage(phone,
    "📋 What billing software do you use?\n\n1️⃣ Busy\n2️⃣ Marg ERP\n3️⃣ Tally\n4️⃣ Vyapar\n5️⃣ myBillBook/Khatabook\n6️⃣ Other\n7️⃣ No billing software\n\nReply with number or name.");
}

async function onboardBilling(phone, text, session) {
  const t = text.toLowerCase().trim();
  const map = { "1": ["busy", "Busy"], "2": ["marg", "Marg ERP"], "3": ["tally", "Tally"], "4": ["vyapar", "Vyapar"], "5": ["mybillbook", "myBillBook"], "6": ["other", "Other"], "7": ["none", "None"] };
  let [sw, swName] = map[t] || ["other", text];
  if (t.includes("busy")) [sw, swName] = ["busy", "Busy"];
  else if (t.includes("marg")) [sw, swName] = ["marg", "Marg ERP"];
  else if (t.includes("tally")) [sw, swName] = ["tally", "Tally"];
  else if (t.includes("vyapar")) [sw, swName] = ["vyapar", "Vyapar"];
  else if (t.includes("mybill") || t.includes("khata")) [sw, swName] = ["mybillbook", "myBillBook"];
  else if (t.includes("no") || t.includes("don") || t.includes("illa") || t.includes("nothing") || t === "7") [sw, swName] = ["none", "None"];

  const ob = { ...session.onboarding, billingSoftware: sw, billingSoftwareName: swName };
  await updateSession(phone, { state: "SHOP_CATALOG", onboarding: ob });

  if (sw !== "none") {
    await sendTextMessage(phone, `👍 ${swName}!\n\n📤 Send your product list:\n📎 Export from ${swName} as Excel/CSV → send here\n📸 Photo of price board\n✍️ Type products with prices\n🎙️ Voice note\n\nProduct codes will flow through to your bills!`);
  } else {
    await sendTextMessage(phone, "👍 No problem!\n\n📤 Tell me what you sell:\n📸 Photo of price board\n✍️ Type products\n🎙️ Voice note\n📎 Any file with products\n\nOr just type: 'all vegetables, grocery items, dairy'");
  }
}

async function onboardCatalog(phone, message, text, type, session) {
  const ob = session.onboarding || {};
  let catalogData = null;

  if (type === "document" && message.document) {
    const { filename, mime_type, id } = message.document;
    console.log(`[${phone}] Catalog file: ${filename}`);

    // Try to parse the file
    let parseResult = null;
    try {
      parseResult = await parseUploadedFile(id, filename, mime_type, ob.billingSoftware);
    } catch (e) {
      console.error("Parse error:", e);
    }

    catalogData = {
      type: "file", fileName: filename, mimeType: mime_type, mediaId: id,
      products: parseResult?.products || [],
      catalogText: parseResult?.products ? buildCatalogText(parseResult.products) : "",
      rawText: "",
    };
  } else if (type === "image" && message.image) {
    catalogData = { type: "image", mediaId: message.image.id, caption: message.image.caption || "", products: [], catalogText: message.image.caption || "", rawText: "" };
  } else if (type === "audio" && message.audio) {
    catalogData = { type: "voice", mediaId: message.audio.id, products: [], catalogText: "", rawText: "" };
  } else if (text && !text.startsWith("__")) {
    const products = parseTextProducts(text);
    catalogData = {
      type: products.length > 0 ? "parsed_list" : "text_description",
      products, rawText: text,
      catalogText: products.length > 0 ? buildCatalogText(products) : text,
    };
  }

  if (!catalogData) {
    await sendTextMessage(phone, "Send your product list:\n📎 Excel/CSV\n📸 Photo\n✍️ Text\n🎙️ Voice");
    return;
  }

  // Create shop
  await finishOnboarding(phone, ob, catalogData);

  // Confirmation
  let msg = `🎉 *${ob.shopName}* is live on Gilli!\n\n📍 ${ob.shopArea}`;
  if (catalogData.type === "file") {
    msg += `\n📋 File: ${catalogData.fileName}`;
    if (catalogData.products.length > 0) {
      msg += `\n✅ ${catalogData.products.length} products parsed with codes!`;
    } else {
      msg += `\nProcessing your file...`;
    }
  } else if (catalogData.products.length > 0) {
    const list = catalogData.products.slice(0, 10).map((p, i) => `  ${i + 1}. ${p.name}${p.code ? " (" + p.code + ")" : ""} — ₹${p.price}`).join("\n");
    msg += `\n\n📋 ${catalogData.products.length} products:\n${list}`;
    if (catalogData.products.length > 10) msg += `\n  ...+${catalogData.products.length - 10} more`;
  } else if (catalogData.rawText) {
    msg += `\n\n📋 "${catalogData.rawText.substring(0, 80)}${catalogData.rawText.length > 80 ? "..." : ""}"`;
  }

  msg += "\n\n💡 *Tip:* Tell customers about your shop story!\nSend a voice note saying what makes your shop special — we'll add it to your profile.\n\nசின்ன கடை. சரியான அடி! 🏏";
  await sendTextMessage(phone, msg);
}

async function finishOnboarding(phone, ob, catalogData) {
  await createShop(phone, {
    name: ob.shopName || "", area: (ob.shopArea || "").toLowerCase(), areaDisplay: ob.shopArea || "",
    category: ob.shopCategory || "other", upiId: ob.shopUpi || "",
    billingSoftware: ob.billingSoftware || "none", billingSoftwareName: ob.billingSoftwareName || "",
    location: { latitude: ob.latitude || null, longitude: ob.longitude || null },
    locationLink: ob.locationLink || "",
    catalogType: catalogData.type, catalogText: catalogData.catalogText || catalogData.rawText || "",
    catalogFileName: catalogData.fileName || "", catalogMediaId: catalogData.mediaId || "",
    tagline: "", story: "", photoUrl: "",
    customerCount: 0, orderCount: 0, rating: 100,
    tier: "free", // free | plus | pro
  });

  // Save parsed products as subcollection
  if (catalogData.products?.length > 0 && db) {
    const batch = db.batch();
    for (const p of catalogData.products) {
      const ref = db.collection("shops").doc(phone).collection("products").doc();
      batch.set(ref, { ...p, available: true, createdAt: new Date() });
    }
    await batch.commit();
  }

  await updateSession(phone, { state: "SHOP_ACTIVE", role: "shop", onboarding: {} });
}

// ========================================================================
// SHOP ACTIVE — Daily operations + LOUDSPEAKER
// ========================================================================
async function shopActive(phone, message, text, type, session) {
  const shop = await getShop(phone);
  const name = shop?.name || "Your shop";
  const t = text.toLowerCase();

  // ---- File upload (updated catalog) ----
  if (type === "document" && message.document) {
    const { filename, mime_type, id } = message.document;
    let parseResult = null;
    try { parseResult = await parseUploadedFile(id, filename, mime_type, shop?.billingSoftware); } catch (e) {}

    if (parseResult?.products?.length > 0 && db) {
      // Clear old products, add new
      const oldProds = await db.collection("shops").doc(phone).collection("products").get();
      const delBatch = db.batch();
      oldProds.forEach(doc => delBatch.delete(doc.ref));
      await delBatch.commit();

      const addBatch = db.batch();
      for (const p of parseResult.products) {
        const ref = db.collection("shops").doc(phone).collection("products").doc();
        addBatch.set(ref, { ...p, available: true, createdAt: new Date() });
      }
      await addBatch.commit();

      await updateShop(phone, {
        catalogType: "file", catalogFileName: filename, catalogMediaId: id,
        catalogText: buildCatalogText(parseResult.products),
      });
      await sendTextMessage(phone, `📋 *${filename}* → ${parseResult.products.length} products updated! ✅\nProduct codes synced with your catalog.`);
    } else {
      await updateShop(phone, { catalogFileName: filename, catalogMediaId: id });
      await sendTextMessage(phone, `📋 *${filename}* received! ✅\nProcessing your catalog...`);
    }
    return;
  }

  // ---- Image ----
  if (type === "image") {
    await sendTextMessage(phone, "📸 Price list photo received! ✅\nUpdating catalog...");
    return;
  }

  // ---- Voice note (could be story or product update) ----
  if (type === "audio") {
    // Check if they were asked for story
    if (session.awaitingStory) {
      await updateShop(phone, { storyMediaId: message.audio.id });
      await updateSession(phone, { awaitingStory: false });
      await sendTextMessage(phone, "🎙️ Shop story saved! ✅\nCustomers will see this on your Billboard profile.");
    } else {
      await sendTextMessage(phone, "🎙️ Voice update received! ✅\nProcessing...");
    }
    return;
  }

  // ---- LOUDSPEAKER: Broadcast to own customers ----
  if (t.startsWith("broadcast:") || t.startsWith("📢") || t.startsWith("announce:")) {
    const broadcastMsg = text.replace(/^(broadcast:|📢|announce:)\s*/i, "").trim();
    if (!broadcastMsg) {
      await sendTextMessage(phone, "Type your broadcast message after 'broadcast:'\nExample: broadcast: Fresh pomfret arrived! ₹400/kg");
      return;
    }
    const customers = await getCustomersForShop(phone);
    if (customers.length === 0) {
      await sendTextMessage(phone, "No customers yet. Once customers order from you, you can broadcast to them.");
      return;
    }
    // Send broadcast
    const msg = `📢 *${name}* — ${shop?.areaDisplay || shop?.area}\n\n${broadcastMsg}\n\nReply *${name.split(" ")[0].toLowerCase()}* to see catalog & order`;
    let sent = 0;
    for (const c of customers) {
      try { await sendTextMessage(c.id, msg); sent++; } catch (e) {}
    }
    await sendTextMessage(phone, `📢 Broadcast sent to ${sent} customers! ✅`);
    return;
  }

  // ---- LOUDSPEAKER: Blast to area (paid) ----
  if (t.startsWith("blast") || t.includes("promote") || t.includes("i want to promote")) {
    const areaCustomers = await getCustomersInArea(shop?.area || "");
    const ownCustomers = await getCustomersForShop(phone);
    const newReach = Math.max(0, areaCustomers.length - ownCustomers.length);
    await sendTextMessage(phone,
      `📢 *Promote ${name}*\n\n` +
      `Your customers: ${ownCustomers.length} (broadcast FREE)\n` +
      `All customers in ${shop?.areaDisplay || shop?.area}: ${areaCustomers.length}\n` +
      `New reach: ${newReach} people\n\n` +
      `Cost: ₹299 for area blast\n\n` +
      `To broadcast to your customers FREE:\nType: broadcast: [your message]\n\n` +
      `Area blast coming soon!`);
    return;
  }

  // ---- BILLBOARD: Edit shop story/tagline ----
  if (t.includes("edit") || t.includes("my shop") || t.includes("profile") || t.includes("billboard")) {
    await sendTextMessage(phone,
      `🏪 *${name}*\n📍 ${shop?.areaDisplay || shop?.area}\n📂 ${shop?.category}\n💳 UPI: ${shop?.upiId}\n💻 Billing: ${shop?.billingSoftwareName || "—"}\n` +
      `📋 Tagline: ${shop?.tagline || "not set"}\n📖 Story: ${shop?.story ? "saved" : "not set"}\n📦 Orders: ${shop?.orderCount || 0}\n✅ Active\n\n` +
      `To update:\n• *tagline: [text]* — one-liner\n• Send a 🎙️ voice note — your shop story\n• *upi: [new id]* — update UPI`);
    return;
  }

  // ---- Set tagline ----
  if (t.startsWith("tagline:")) {
    const tagline = text.replace(/^tagline:\s*/i, "").trim();
    await updateShop(phone, { tagline });
    await sendTextMessage(phone, `✅ Tagline saved: "${tagline}"`);
    return;
  }

  // ---- Update UPI ----
  if (t.startsWith("upi:")) {
    const upi = text.replace(/^upi:\s*/i, "").trim();
    await updateShop(phone, { upiId: upi });
    await sendTextMessage(phone, `✅ UPI updated: ${upi}`);
    return;
  }

  // ---- Today's specials (morning update for Loudspeaker feed) ----
  if (t.startsWith("today:") || t.startsWith("special:") || t.startsWith("today's:")) {
    const special = text.replace(/^(today:|special:|today's:)\s*/i, "").trim();
    await saveDailySpecial(phone, special);
    await sendTextMessage(phone, `✅ Today's special saved!\nCustomers who ask 'what's new' will see this.`);
    return;
  }

  // ---- Orders ----
  if (t.includes("order") || t.includes("ஆர்டர்")) {
    const orders = await getShopOrdersToday(phone);
    if (orders.length === 0) {
      await sendTextMessage(phone, `📦 No orders yet today for *${name}*.`);
    } else {
      let msg = `📦 *Today's orders — ${name}:*\n\n`;
      orders.forEach((o, i) => {
        msg += `${i + 1}. Bill: ${o.billNumber || "—"} | ₹${o.total} | ${o.status}\n`;
      });
      await sendTextMessage(phone, msg);
    }
    return;
  }

  // ---- Accept/reject order ----
  if (t.startsWith("accept ") || t.startsWith("reject ")) {
    const parts = t.split(" ");
    const action = parts[0];
    const orderId = parts[1];
    if (orderId) {
      const status = action === "accept" ? "accepted" : "rejected";
      await updateOrder(orderId, { status });
      await sendTextMessage(phone, `✅ Order ${orderId.substring(0, 6)} ${status}!`);
    }
    return;
  }

  // ---- Availability: "no tomato", "out of stock" ----
  if (t.startsWith("no ") || t.includes("illa") || t.includes("இல்ல") || t.includes("out of stock") || t.includes("not available")) {
    await sendTextMessage(phone, "✅ Noted! Customers won't see these items.");
    return;
  }

  // ---- Price updates ----
  if (t.includes("price") || t.includes("rate") || t.includes("விலை")) {
    await sendTextMessage(phone, "✅ Price updated!");
    return;
  }

  // ---- Greetings ----
  if (t === "hi" || t === "hello" || t === "vanakkam" || t === "வணக்கம்" || t === "gm") {
    await sendTextMessage(phone,
      `Welcome back! *${name}* is active ✅\n\n` +
      `📎 Send catalog file → update products\n` +
      `📢 broadcast: [msg] → announce to customers\n` +
      `✍️ tagline: [text] → set shop tagline\n` +
      `🎙️ Voice note → set shop story\n` +
      `✍️ today: [text] → set daily special\n` +
      `💰 "my orders" → today's orders\n` +
      `🏪 "my shop" → your profile`);
    return;
  }

  // ---- Default ----
  await sendTextMessage(phone,
    `👍 Got it!\n\nCommands:\n• broadcast: [msg]\n• tagline: [text]\n• today: [special]\n• "my orders"\n• "my shop"\n• Send file to update catalog`);
}

// ========================================================================
// CUSTOMER ACTIVE — Browse, search, discover
// ========================================================================
async function customerActive(phone, message, text, type, session) {
  const t = text.toLowerCase();

  // ---- Location shared ----
  if (type === "location" && message.location) {
    const { latitude, longitude } = message.location;
    const allShops = await getActiveShops();
    if (allShops.length === 0) {
      await sendTextMessage(phone, "No shops yet in your area. We're growing! 🌱"); return;
    }
    let shops = allShops.map(s => ({
      ...s, distance: calcDistance(latitude, longitude, s.location?.latitude, s.location?.longitude),
    })).sort((a, b) => a.distance - b.distance).slice(0, 10);

    let msg = "📍 *Shops near you:*\n\n";
    shops.forEach((s, i) => {
      const dist = s.distance < 1 ? `${Math.round(s.distance * 1000)}m` : `${s.distance.toFixed(1)}km`;
      const walk = Math.round(s.distance * 12);
      msg += `*${i + 1}.* 🏪 *${s.name}* — ${s.areaDisplay || s.area}\n`;
      msg += `   ${s.category} | 📍 ${dist} (~${walk}min walk)\n`;
      if (s.tagline) msg += `   _"${s.tagline}"_\n`;
      msg += "\n";
    });
    msg += "Reply with shop number to see details.\nOr type what you need.";

    await sendTextMessage(phone, msg);
    await updateSession(phone, {
      lastLocation: { latitude, longitude },
      shopList: shops.map(s => s.id), // Store for reference
    });
    await createOrUpdateCustomer(phone, { lastLocation: { latitude, longitude } });
    return;
  }

  // ---- "What's new today?" — LOUDSPEAKER pull feed ----
  if (t.includes("what's new") || t.includes("whats new") || t.includes("today") || t.includes("special") || t.includes("fresh")) {
    const customerData = await createOrUpdateCustomer(phone, {}) || {};
    const area = customerData?.area || session?.lastArea;
    if (!area) {
      await sendTextMessage(phone, "📍 Share your location or type your area name first, then ask what's new!");
      return;
    }
    const specials = await getDailySpecialsForArea(area);
    if (specials.length === 0) {
      await sendTextMessage(phone, `📢 No specials posted yet today in ${area}.\nCheck back later!`);
      return;
    }
    let msg = `📢 *What's fresh today in ${area}:*\n\n`;
    specials.forEach(({ shop, special }) => {
      msg += `🏪 *${shop.name}*\n${special.message}\n\n`;
    });
    msg += "Reply with shop name to order.";
    await sendTextMessage(phone, msg);
    return;
  }

  // ---- "My shops" — saved shops ----
  if (t.includes("my shop") || t.includes("saved")) {
    await sendTextMessage(phone, "Saved shops feature coming soon!\nFor now, share your location or type an area name.");
    return;
  }

  // ---- Numeric reply — selecting a shop from previous list ----
  const num = parseInt(t);
  if (num >= 1 && num <= 10 && session.shopList?.length >= num) {
    const shopPhone = session.shopList[num - 1];
    await showBillboard(phone, shopPhone, session);
    return;
  }

  // ---- Greetings ----
  if (t === "hi" || t === "hello" || t === "vanakkam" || t === "வணக்கம்") {
    await sendTextMessage(phone, "Welcome to Gilli! 🛒\n\n📍 Share location → nearby shops\n✍️ Type area (Mylapore, T Nagar)\n🔍 Type product (curd, rice)\n📢 *what's new* → today's specials");
    return;
  }

  if (!db) { await sendTextMessage(phone, "Service temporarily unavailable."); return; }

  // ---- Search by area ----
  const areaShops = await getShopsByArea(t);
  if (areaShops.length > 0) {
    let msg = `📍 *Shops in ${text}:*\n\n`;
    const ids = [];
    areaShops.forEach((s, i) => {
      msg += `*${i + 1}.* 🏪 *${s.name}*\n   ${s.category}${s.tagline ? " | _" + s.tagline + "_" : ""}\n\n`;
      ids.push(s.id);
    });
    msg += "Reply number to see shop details.";
    await sendTextMessage(phone, msg);
    await updateSession(phone, { shopList: ids, lastArea: t });
    await createOrUpdateCustomer(phone, { area: t });
    return;
  }

  // ---- Product search across all shops ----
  const allShops = await getActiveShops();
  let matches = allShops.filter(s => {
    const searchable = `${s.name} ${s.category} ${s.catalogText || ""} ${s.areaDisplay || s.area}`.toLowerCase();
    return searchable.includes(t);
  });

  if (matches.length > 0) {
    let msg = `🔍 *"${text}" found at:*\n\n`;
    const ids = [];
    matches.slice(0, 8).forEach((s, i) => {
      msg += `*${i + 1}.* 🏪 *${s.name}* — ${s.areaDisplay || s.area}\n   ${s.category}\n\n`;
      ids.push(s.id);
    });
    msg += "Reply number to see shop details.";
    await sendTextMessage(phone, msg);
    await updateSession(phone, { shopList: ids });
    return;
  }

  await sendTextMessage(phone, `No results for "${text}".\n\n📍 Share location to see all nearby shops\n✍️ Try a different area or product`);
}

// ========================================================================
// LAYER 2: BILLBOARD — Shop profile display
// ========================================================================
async function showBillboard(customerPhone, shopPhone, session) {
  const shop = await getShop(shopPhone);
  if (!shop) { await sendTextMessage(customerPhone, "Shop not found."); return; }

  let msg = `🏪 *${shop.name}*\n`;
  msg += `📍 ${shop.areaDisplay || shop.area}\n`;
  msg += `📂 ${shop.category}\n`;

  if (shop.tagline) msg += `\n_"${shop.tagline}"_\n`;
  if (shop.story) msg += `\n📖 ${shop.story}\n`;

  // Trust signals
  const signals = [];
  if (shop.orderCount >= 50) signals.push("🏏 Trusted Shop");
  if (shop.customerCount >= 20) signals.push(`👥 ${shop.customerCount} customers`);
  if (shop.orderCount > 0) signals.push(`📦 ${shop.orderCount} orders`);
  if (shop.rating) signals.push(`⭐ ${shop.rating}% positive`);
  if (signals.length > 0) msg += `\n${signals.join(" | ")}\n`;

  msg += `\n💳 UPI: ${shop.upiId}\n`;

  // Show product preview
  const products = await getShopProducts(shopPhone);
  if (products.length > 0) {
    msg += `\n📋 *Today's items (${products.length}):*\n`;
    products.slice(0, 15).forEach((p, i) => {
      msg += `${i + 1}. ${p.name}${p.unit ? " " + p.unit : ""} — ₹${p.price}${p.code ? " [" + p.code + "]" : ""}\n`;
    });
    if (products.length > 15) msg += `...+${products.length - 15} more\n`;
    msg += `\nReply with items to order:\nExample: *1x2, 3x1, 5x1*\n(2 of item 1, 1 of item 3, 1 of item 5)`;
  } else if (shop.catalogText) {
    msg += `\n📋 Products: ${shop.catalogText.substring(0, 200)}${shop.catalogText.length > 200 ? "..." : ""}`;
    msg += `\n\nContact shop to order.`;
  }
  msg += "\n\n⬅️ Reply *back* to see other shops";

  await sendTextMessage(customerPhone, msg);
  await updateSession(customerPhone, {
    state: "CUSTOMER_VIEWING_SHOP",
    viewingShop: shopPhone,
    shopProducts: products.map(p => ({ id: p.id, name: p.name, price: p.price, unit: p.unit || "", code: p.code || "", gst: p.gst || 0 })),
  });

  // Track customer visiting this shop
  await createOrUpdateCustomer(customerPhone, { lastShop: shopPhone });
}

// ========================================================================
// CUSTOMER VIEWING SHOP — Order from it
// ========================================================================
async function customerViewShop(phone, message, text, type, session) {
  const t = text.toLowerCase();

  if (t === "back" || t === "⬅️") {
    await updateSession(phone, { state: "CUSTOMER_ACTIVE", viewingShop: null, shopProducts: null });
    await sendTextMessage(phone, "📍 Share location or type area name to browse shops.\n🔍 Or type what you need.");
    return;
  }

  // Parse order: "1x2, 3x1, 5x1" or "1 2, 3 1" or just item numbers
  const products = session.shopProducts || [];
  if (products.length === 0) {
    await sendTextMessage(phone, "No product list available. Reply *back* to browse other shops.");
    return;
  }

  const orderItems = parseOrderText(text, products);
  if (orderItems.length === 0) {
    await sendTextMessage(phone, "Couldn't understand your order.\nFormat: *1x2, 3x1* (item#×qty)\nOr type product name and quantity.\n\nReply *back* to browse shops.");
    return;
  }

  const shop = await getShop(session.viewingShop);
  if (!shop) { await sendTextMessage(phone, "Shop not found. Reply *back*."); return; }

  const { message: summaryMsg, total } = generateOrderSummary(orderItems, shop);
  await sendTextMessage(phone, summaryMsg);

  await updateSession(phone, {
    state: "CUSTOMER_CONFIRM_ORDER",
    pendingOrder: { items: orderItems, total, shopPhone: session.viewingShop },
  });
}

// ========================================================================
// CUSTOMER CONFIRM ORDER — Place or cancel
// ========================================================================
async function customerConfirmOrder(phone, text, session) {
  const t = text.toLowerCase();

  if (t === "confirm" || t === "yes" || t === "ok" || t === "place" || t === "order") {
    const order = session.pendingOrder;
    if (!order) { await sendTextMessage(phone, "No pending order. Browse shops again."); return; }

    const shop = await getShop(order.shopPhone);
    if (!shop) { await sendTextMessage(phone, "Shop not found."); return; }

    // Create order in Firestore
    const orderId = await createOrder({
      customerPhone: phone,
      shopPhone: order.shopPhone,
      shopName: shop.name,
      items: order.items,
      total: order.total,
    });

    // Generate bill
    const { customerBill, shopBill, billNumber } = generateBill(shop, order.items, orderId || "000000");

    // Update order with bill number
    if (orderId) await updateOrder(orderId, { billNumber });

    // Send bill to customer
    await sendTextMessage(phone, customerBill);

    // Notify shop owner
    let shopNotif = shopBill;
    shopNotif += `\n\n👤 Customer: ${phone}\n`;
    shopNotif += `Reply: *accept ${orderId?.substring(0, 6)}* or *reject ${orderId?.substring(0, 6)}*`;
    await sendTextMessage(order.shopPhone, shopNotif);

    // Save customer as linked to this shop
    await createOrUpdateCustomer(phone, {
      savedShops: FieldValue.arrayUnion(order.shopPhone),
      lastOrder: new Date(),
      area: shop.area,
    });

    // Increment customer count on shop
    await updateShop(order.shopPhone, { customerCount: FieldValue.increment(1) });

    await updateSession(phone, {
      state: "CUSTOMER_ACTIVE",
      pendingOrder: null, viewingShop: null, shopProducts: null,
    });

  } else if (t === "cancel" || t === "no") {
    await sendTextMessage(phone, "❌ Order cancelled.\n\n📍 Share location or type area to browse shops.");
    await updateSession(phone, {
      state: "CUSTOMER_ACTIVE",
      pendingOrder: null, viewingShop: null, shopProducts: null,
    });

  } else {
    await sendTextMessage(phone, "Reply *confirm* to place order or *cancel* to cancel.");
  }
}

// ========================================================================
// CUSTOMER ORDERING — direct text ordering
// ========================================================================
async function customerOrdering(phone, text, session) {
  // This state handles free-text ordering if needed
  await customerViewShop(phone, null, text, "text", session);
}

// ========================================================================
// ORDER TEXT PARSER — "1x2, 3x1" or "tomato 2kg, onion 1kg"
// ========================================================================
function parseOrderText(text, products) {
  const items = [];

  // Pattern 1: "1x2, 3x1, 5x3" (item_number × quantity)
  const matches = text.matchAll(/(\d+)\s*[x×]\s*(\d+)/gi);
  for (const m of matches) {
    const idx = parseInt(m[1]) - 1;
    const qty = parseInt(m[2]);
    if (idx >= 0 && idx < products.length && qty > 0) {
      items.push({ ...products[idx], qty });
    }
  }

  if (items.length > 0) return items;

  // Pattern 2: Just numbers like "1 2 3" (assume qty 1 each)
  const nums = text.match(/\d+/g);
  if (nums && nums.length > 0 && nums.every(n => parseInt(n) >= 1 && parseInt(n) <= products.length)) {
    for (const n of nums) {
      const idx = parseInt(n) - 1;
      items.push({ ...products[idx], qty: 1 });
    }
    return items;
  }

  // Pattern 3: Product names like "tomato 2kg, onion 1kg"
  const parts = text.split(/[,\n]+/).map(s => s.trim()).filter(s => s);
  for (const part of parts) {
    const qtyMatch = part.match(/(\d+)\s*(kg|g|L|ml|pcs)?/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
    const searchTerm = part.replace(/\d+\s*(kg|g|L|ml|pcs)?/i, "").trim().toLowerCase();

    if (searchTerm) {
      const match = products.find(p => p.name.toLowerCase().includes(searchTerm));
      if (match) items.push({ ...match, qty });
    }
  }

  return items;
}

// ========================================================================
// TEXT PRODUCT PARSER (for manual text input during onboarding)
// ========================================================================
function parseTextProducts(text) {
  const products = [];
  const lines = text.split(/[\n;]+/).map(s => s.trim()).filter(s => s);
  let items = [];
  for (const line of lines) {
    if (line.includes(",") && !line.match(/\d+,\d+/)) {
      items.push(...line.split(",").map(s => s.trim()).filter(s => s));
    } else {
      items.push(line);
    }
  }

  for (let item of items) {
    item = item.replace(/^[\d]+[.)]\s*/, "").replace(/^[-•]\s*/, "").trim();
    if (item.length < 3) continue;

    // "Code Name Unit Price" — billing software format
    let m = item.match(/^([A-Z]{1,5}\d{2,5})\s+(.+?)\s+(\d+\s*(?:kg|g|L|ml|pcs)?)\s*(?:rs\.?|₹)?\s*(\d+)$/i);
    if (m) { products.push({ name: m[2].trim(), code: m[1].toUpperCase(), unit: m[3].trim(), price: parseInt(m[4]), available: true }); continue; }

    // "Name Unit Price"
    m = item.match(/^(.+?)\s+(\d+\s*(?:kg|g|gm|L|lt|ml|pcs|piece|bunch|packet|pack|box|bottle|dozen)?)\s*(?:rs\.?|₹)?\s*(\d+)$/i);
    if (m) { products.push({ name: m[1].trim(), code: "", unit: m[2].trim(), price: parseInt(m[3]), available: true }); continue; }

    // "Name ₹Price/unit"
    m = item.match(/^(.+?)\s*(?:rs\.?|₹)\s*(\d+)\s*(?:per\s*|\/)\s*(kg|g|L|ml|pcs|piece|dozen|packet)?$/i);
    if (m) { products.push({ name: m[1].trim(), code: "", unit: m[3] ? "per " + m[3] : "", price: parseInt(m[2]), available: true }); continue; }

    // "Name Price"
    m = item.match(/^(.+?)\s+(?:rs\.?|₹)?\s*(\d+)\s*(?:rs\.?|₹)?$/i);
    if (m && parseInt(m[2]) > 0 && parseInt(m[2]) < 50000) {
      products.push({ name: m[1].trim().replace(/[\s\-]+$/, ""), code: "", unit: "", price: parseInt(m[2]), available: true });
    }
  }
  return products;
}