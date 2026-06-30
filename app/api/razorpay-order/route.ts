import { NextResponse } from 'next/server';
import { PRICE_PAISE, CURRENCY } from '../../../lib/siteConfig';

// Creates a Razorpay Order server-side when a secret key is configured.
// If RAZORPAY_KEY_SECRET is not set, returns { orderless: true } so the
// client can still open Razorpay checkout in test mode without an order.
export async function POST() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // No secret -> let the client run the simpler keyless (test-mode) flow.
  if (!keyId || !keySecret) {
    return NextResponse.json({ orderless: true, amount: PRICE_PAISE, currency: CURRENCY });
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: PRICE_PAISE,
        currency: CURRENCY,
        receipt: `health_audit_${Date.now()}`,
        notes: { product: 'Health Audit' },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: 'Failed to create Razorpay order', detail },
        { status: 502 }
      );
    }

    const order = await res.json();
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Razorpay order request failed', detail: String(err) },
      { status: 500 }
    );
  }
}
