import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { forwardToWebhook } from '../../../lib/serverWebhook';

export const runtime = 'nodejs';

// ──────────────────────────────────────────────────────────────
//  PURCHASE CONFIRMATION (server-authoritative)
//
//  This is the ONLY place the PURCHASE webhook (PABBLY_WEBHOOK_URL)
//  can be fired. It will fire ONLY when:
//    • mode 'razorpay'  → the Razorpay payment signature is valid, OR
//    • mode 'coupon'    → the coupon equals the configured free coupon.
//
//  A forged client request cannot trigger the purchase webhook because
//  the HMAC signature can only be produced with the secret key, and the
//  coupon is checked server-side.
// ──────────────────────────────────────────────────────────────

function timingSafeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, verified: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const mode: string = body.mode || 'razorpay';
  const payload: Record<string, any> = body.payload || {};

  // ── Free / 100%-off coupon path ──
  if (mode === 'coupon') {
    const configured = (process.env.NEXT_PUBLIC_FREE_COUPON_CODE ?? 'FREEAUDIT').trim().toUpperCase();
    const provided = String(body.coupon_code ?? '').trim().toUpperCase();
    if (!provided || provided !== configured) {
      return NextResponse.json(
        { ok: false, verified: false, error: 'Invalid coupon' },
        { status: 400 }
      );
    }
    // Force the amount to 0 server-side so a tampered client can't claim a paid sale.
    const result = await forwardToWebhook(
      process.env.PABBLY_WEBHOOK_URL,
      { ...payload, amount: 0, coupon_code: configured, payment_id: '', order_id: '' },
      req
    );
    // verified=true is the gate; a webhook-forward hiccup must not block the sale.
    return NextResponse.json({ ok: true, verified: true, forwarded: result.forwarded, status: result.status });
  }

  // ── Razorpay paid path ──
  const orderId = String(body.razorpay_order_id ?? '');
  const paymentId = String(body.razorpay_payment_id ?? '');
  const signature = String(body.razorpay_signature ?? '');
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    // No secret configured → we cannot verify, so we must NOT fire the webhook.
    return NextResponse.json(
      { ok: false, verified: false, error: 'Payment verification not configured (missing secret).' },
      { status: 500 }
    );
  }
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { ok: false, verified: false, error: 'Missing payment fields.' },
      { status: 400 }
    );
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (!timingSafeEqualHex(expected, signature)) {
    return NextResponse.json(
      { ok: false, verified: false, error: 'Signature verification failed.' },
      { status: 400 }
    );
  }

  // Verified — forward the purchase with the trusted payment identifiers.
  const result = await forwardToWebhook(
    process.env.PABBLY_WEBHOOK_URL,
    { ...payload, payment_id: paymentId, order_id: orderId },
    req
  );
  // verified=true is the gate; a webhook-forward hiccup must not block the sale.
  return NextResponse.json({ ok: true, verified: true, forwarded: result.forwarded, status: result.status });
}
