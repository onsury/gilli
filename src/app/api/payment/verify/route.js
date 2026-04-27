import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimit, getClientIp } from '../../../../lib/ratelimit';
import { invoiceUrl } from '../../../../lib/invoiceToken';
export async function POST(req) {
  const ip = getClientIp(req);
  const rl = rateLimit(ip + ':verify', 10, 10 * 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: { 'Retry-After': Math.ceil(rl.resetIn / 1000).toString() } });
  }
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, businessId, phone } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }
    if (!businessId || !phone) {
      return NextResponse.json({ error: 'Missing businessId or phone' }, { status: 400 });
    }
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    const existing = await adminDb.collection('payments').where('paymentId', '==', razorpay_payment_id).limit(1).get();
    if (!existing.empty) {
      const existingData = existing.docs[0].data();
      return NextResponse.json({ success: true, duplicate: true, expiresAt: existingData.expiresAt, invoiceUrl: invoiceUrl(razorpay_payment_id) });
    }
    const bizSnap = await adminDb.collection('businesses').doc(businessId).get();
    if (!bizSnap.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    const expireMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(expireMs);
    const batch = adminDb.batch();
    batch.update(adminDb.collection('businesses').doc(businessId), {
      premium: true, premium_since: FieldValue.serverTimestamp(),
      premium_expires: expiresAt.toISOString(), premium_phone: phone,
      last_payment_id: razorpay_payment_id, last_order_id: razorpay_order_id,
    });
    batch.set(adminDb.collection('payments').doc(), {
      businessId, phone, orderId: razorpay_order_id, paymentId: razorpay_payment_id,
      amount: 49900, currency: 'INR', plan: 'premium_monthly',
      paidAt: FieldValue.serverTimestamp(), expiresAt: expiresAt.toISOString(),
    });
    await batch.commit();
    const signedUrl = invoiceUrl(razorpay_payment_id);
    console.log('Payment verified. Invoice:', signedUrl);
    return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString(), invoiceUrl: signedUrl });
  } catch (e) {
    console.error('verify error:', e?.message || e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
