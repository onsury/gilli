// src/lib/claims/index.js
// Utilities for the "Claim Your Shop" flow.

import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { clientDb as db } from '../firebase-client';

/**
 * Check if a business has been claimed.
 * Returns { claimed: boolean, claimed_by_phone: string|null, claimed_at: timestamp|null, verified: boolean }
 */
export async function getClaimStatus(businessId) {
  const snap = await getDoc(doc(db, 'businesses', businessId));
  if (!snap.exists()) return { claimed: false, error: 'Business not found' };
  const data = snap.data();
  return {
    claimed: data.claimed === true,
    claimed_by_phone: data.claimed_by_phone || null,
    claimed_at: data.claimed_at || null,
    verified: data.verified === true,
  };
}

/**
 * Record a successful claim in Firestore.
 * Called AFTER OTP verification succeeds.
 * Updates the business doc + writes an audit log entry.
 */
export async function recordClaim(businessId, phone, ownerName) {
  // Update the business doc
  const businessRef = doc(db, 'businesses', businessId);
  await updateDoc(businessRef, {
    claimed: true,
    claimed_by_phone: phone,
    claimed_by_name: ownerName || '',
    claimed_at: serverTimestamp(),
    verified: true,
  });

  // Add audit log entry
  const auditRef = doc(collection(db, 'claim_audit'));
  await setDoc(auditRef, {
    business_id: businessId,
    phone,
    owner_name: ownerName || '',
    action: 'claimed',
    created_at: serverTimestamp(),
  });

  return { success: true };
}

/**
 * Save owner edits to a claimed business.
 * These edits override the default fields on the public page.
 */
export async function saveOwnerEdits(businessId, edits) {
  const businessRef = doc(db, 'businesses', businessId);
  const updatePayload = {
    owner_edited_at: serverTimestamp(),
  };

  // Only allow specific fields to be edited by owners
  const allowedFields = ['owner_phone', 'owner_hours', 'owner_description', 'owner_whatsapp', 'owner_website', 'owner_instagram'];
  allowedFields.forEach(f => {
    if (f in edits) updatePayload[f] = edits[f] || '';
  });

  await updateDoc(businessRef, updatePayload);

  // Audit log
  const auditRef = doc(collection(db, 'claim_audit'));
  await setDoc(auditRef, {
    business_id: businessId,
    action: 'edited',
    edits: updatePayload,
    created_at: serverTimestamp(),
  });

  return { success: true };
}

/**
 * Check if a phone number has already claimed any shops (to prevent abuse).
 * Returns array of businessIds claimed by this phone.
 */
export async function getShopsClaimedByPhone(phone) {
  const q = query(
    collection(db, 'businesses'),
    where('claimed_by_phone', '==', phone)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
