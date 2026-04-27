import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
 
export async function POST(req) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      businessId,
      phone,
    } = await req.json();
 
    // Validate all required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }
    if (!businessId || !phone) {
      return NextResponse.json({ error: 'Missing businessId or phone' }, { status: 400 });
    }
 
    // Verify Razorpay signature first
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
 
    if (expected !== razorpay_signature) {
      console.error('Invalid Razorpay signature for payment:', razorpay_payment_id);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
 
    // IDEMPOTENCY CHECK -- prevent duplicate payment records
    const existing = await adminDb
      .collection('payments')
      .where('paymentId', '==', razorpay_payment_id)
      .limit(1)
      .get();
 
    if (!existing.empty) {
      // Already processed -- return success without re-writing
      const existingData = existing.docs[0].data();
      console.log('Duplicate payment webhook ignored:', razorpay_payment_id);
      return NextResponse.json({
        success: true,
        duplicate: true,
        expiresAt: existingData.expiresAt,
        invoiceUrl: 'https://mygully.in/invoice/' + razorpay_payment_id,
      });
    }
 
    // Verify business exists before marking premium
    const bizSnap = await adminDb.collection('businesses').doc(businessId).get();
    if (!bizSnap.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
 
    // Calculate expiry
    const expireMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(expireMs);
 
    // Use a Firestore batch for atomicity -- both writes succeed or both fail
    const batch = adminDb.batch();
 
    const bizRef = adminDb.collection('businesses').doc(businessId);
    batch.update(bizRef, {
      premium: true,
      premium_since: FieldValue.serverTimestamp(),
      premium_expires: expiresAt.toISOString(),
      premium_phone: phone,
      last_payment_id: razorpay_payment_id,
      last_order_id: razorpay_order_id,
    });
 
    const paymentRef = adminDb.collection('payments').doc();
    batch.set(paymentRef, {
      businessId,
      phone,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: 49900,
      currency: 'INR',
      plan: 'premium_monthly',
      paidAt: FieldValue.serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
    });
 
    await batch.commit();
 
    // Log invoice URL for WhatsApp delivery (Meta API integration pending)
    const invoiceUrl = 'https://mygully.in/invoice/' + razorpay_payment_id;
    console.log('Payment verified. Invoice:', invoiceUrl, 'Shop:', bizSnap.data()?.name);
 
    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
      invoiceUrl,
    });
  } catch (e) {
    console.error('verify error:', e?.message || e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}