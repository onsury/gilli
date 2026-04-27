import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { rateLimit, getClientIp } from '../../../../lib/ratelimit';
export async function POST(req) {
  const ip = getClientIp(req);
  const rl = rateLimit(ip + ':create-order', 5, 10 * 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many payment attempts. Please try again in a few minutes.' }, { status: 429, headers: { 'Retry-After': Math.ceil(rl.resetIn / 1000).toString() } });
  }
  try {
    const { businessId, phone } = await req.json();
    if (!businessId || typeof businessId !== 'string' || businessId.length > 100) {
      return NextResponse.json({ error: 'Invalid businessId' }, { status: 400 });
    }
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
    }
    const snap = await adminDb.collection('businesses').doc(businessId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await razorpay.orders.create({
      amount: 49900,
      currency: 'INR',
      receipt: 'gully_' + businessId.slice(0, 10) + '_' + Date.now(),
      notes: { businessId, phone: phone.replace(/\D/g, '').slice(-10), plan: 'premium_monthly' },
    });
    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) {
    console.error('create-order error:', e?.message || e);
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 });
  }
}
