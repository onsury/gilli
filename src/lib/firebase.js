// src/lib/firebase.js
// Firestore connection + all CRUD operations

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin (only once)
let db;
try {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  db = getFirestore();
} catch (err) {
  console.error("Firebase init error:", err.message);
  db = null;
}

// ============================================
// SESSION functions
// ============================================
export async function getSession(phone) {
  if (!db) return null;
  const doc = await db.collection("sessions").doc(phone).get();
  return doc.exists ? doc.data() : null;
}

export async function updateSession(phone, data) {
  if (!db) return;
  await db.collection("sessions").doc(phone).set(
    { ...data, lastActive: new Date() },
    { merge: true }
  );
}

export async function deleteSession(phone) {
  if (!db) return;
  await db.collection("sessions").doc(phone).delete();
}

// ============================================
// SHOP functions
// ============================================
export async function getShop(phone) {
  if (!db) return null;
  const doc = await db.collection("shops").doc(phone).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function createShop(phone, data) {
  if (!db) return;
  await db.collection("shops").doc(phone).set({
    ...data,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateShop(phone, data) {
  if (!db) return;
  await db.collection("shops").doc(phone).update({
    ...data,
    updatedAt: new Date(),
  });
}

// Get shops by area
export async function getShopsByArea(area) {
  if (!db) return [];
  const snapshot = await db.collection("shops")
    .where("area", "==", area.toLowerCase())
    .where("status", "==", "active")
    .limit(15)
    .get();
  const shops = [];
  snapshot.forEach(doc => shops.push({ id: doc.id, ...doc.data() }));
  return shops;
}

// Get all active shops (for location-based or product search)
export async function getActiveShops(limit = 50) {
  if (!db) return [];
  const snapshot = await db.collection("shops")
    .where("status", "==", "active")
    .limit(limit)
    .get();
  const shops = [];
  snapshot.forEach(doc => shops.push({ id: doc.id, ...doc.data() }));
  return shops;
}

// Get shop products subcollection
export async function getShopProducts(shopPhone) {
  if (!db) return [];
  const snapshot = await db.collection("shops").doc(shopPhone)
    .collection("products")
    .where("available", "==", true)
    .orderBy("name")
    .get();
  const products = [];
  snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
  return products;
}

// ============================================
// CUSTOMER functions
// ============================================
export async function getCustomer(phone) {
  if (!db) return null;
  const doc = await db.collection("customers").doc(phone).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function createOrUpdateCustomer(phone, data) {
  if (!db) return;
  await db.collection("customers").doc(phone).set(data, { merge: true });
}

// ============================================
// ORDER functions
// ============================================
export async function createOrder(orderData) {
  if (!db) return null;
  const ref = await db.collection("orders").add({
    ...orderData,
    status: "placed",
    paymentStatus: "pending",
    createdAt: new Date(),
  });

  // Increment shop order count
  if (orderData.shopPhone) {
    await db.collection("shops").doc(orderData.shopPhone).update({
      orderCount: FieldValue.increment(1),
    });
  }

  return ref.id;
}

export async function getOrder(orderId) {
  if (!db) return null;
  const doc = await db.collection("orders").doc(orderId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function updateOrder(orderId, data) {
  if (!db) return;
  await db.collection("orders").doc(orderId).update({
    ...data,
    updatedAt: new Date(),
  });
}

// Get today's orders for a shop
export async function getShopOrdersToday(shopPhone) {
  if (!db) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const snapshot = await db.collection("orders")
    .where("shopPhone", "==", shopPhone)
    .where("createdAt", ">=", today)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();
  const orders = [];
  snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
  return orders;
}

// ============================================
// BROADCAST functions
// ============================================
export async function getCustomersInArea(area) {
  if (!db) return [];
  const snapshot = await db.collection("customers")
    .where("area", "==", area.toLowerCase())
    .limit(500)
    .get();
  const customers = [];
  snapshot.forEach(doc => customers.push({ id: doc.id, ...doc.data() }));
  return customers;
}

export async function getCustomersForShop(shopPhone) {
  if (!db) return [];
  const snapshot = await db.collection("customers")
    .where("savedShops", "array-contains", shopPhone)
    .limit(200)
    .get();
  const customers = [];
  snapshot.forEach(doc => customers.push({ id: doc.id, ...doc.data() }));
  return customers;
}

// Store daily special message
export async function saveDailySpecial(shopPhone, message) {
  if (!db) return;
  const today = new Date().toISOString().split("T")[0];
  await db.collection("dailySpecials").doc(`${shopPhone}_${today}`).set({
    shopPhone,
    message,
    date: today,
    createdAt: new Date(),
  });
}

// Get today's specials for an area
export async function getDailySpecialsForArea(area) {
  if (!db) return [];
  const today = new Date().toISOString().split("T")[0];
  // Get all shops in area, then their specials
  const shops = await getShopsByArea(area);
  const specials = [];
  for (const shop of shops) {
    const doc = await db.collection("dailySpecials").doc(`${shop.id}_${today}`).get();
    if (doc.exists) {
      specials.push({ shop, special: doc.data() });
    }
  }
  return specials;
}

export { db, FieldValue };