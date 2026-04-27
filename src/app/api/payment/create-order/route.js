import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

export async function POST(req) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const { businessId, phone } = await req.json();
    if (!businessId || !phone) {
      return NextResponse.json({ error: 'Missing businessId or phone' }, { status: 400 });
    }
    const snap = await adminDb.collection('businesses').doc(businessId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    const order = await razorpay.orders.create({
      amount: 49900,
      currency: 'INR',
      receipt: 'gully_' + businessId.slice(0, 10),
      notes: { businessId, phone, plan: 'premium_monthly' },
    });
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    console.error('create-order error:', e);
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 });
  }
}
