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
 
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
 
    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
 
    const expireMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(expireMs);
 
    await adminDb.collection('businesses').doc(businessId).update({
      premium: true,
      premium_since: FieldValue.serverTimestamp(),
      premium_expires: expiresAt.toISOString(),
      premium_phone: phone,
      last_payment_id: razorpay_payment_id,
      last_order_id: razorpay_order_id,
    });
 
    await adminDb.collection('payments').add({
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
 
    // Send WhatsApp invoice link
    try {
      const cleanPhone = (phone || '').replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        const invoiceUrl = 'https://mygully.in/invoice/' + razorpay_payment_id;
        const msg = 'Hi! Your Gully Premium listing is now active. Download your invoice here: ' + invoiceUrl + ' Valid for 30 days. Thank you - Team Gully, mygully.in';
        const waUrl = 'https://api.whatsapp.com/send?phone=91' + cleanPhone.slice(-10) + '&text=' + encodeURIComponent(msg);
        console.log('Invoice WhatsApp URL:', waUrl);
      }
    } catch (waErr) {
      console.error('WhatsApp notification failed:', waErr);
    }
    return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString(), invoiceUrl: 'https://mygully.in/invoice/' + razorpay_payment_id });
  } catch (e) {
    console.error('verify error:', e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}