import { NextRequest, NextResponse } from 'next/server';
import { forwardToWebhook } from '../../../lib/serverWebhook';

export const runtime = 'nodejs';

// Receives the quiz / CTA popup submission (top-of-funnel lead) and forwards
// it — enriched with the client IP — to the FORM_PABBLY_WEBHOOK webhook.
// This is a plain lead event (no payment claim), so it is fine to be public.
export async function POST(req: NextRequest) {
  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const result = await forwardToWebhook(process.env.FORM_PABBLY_WEBHOOK, body, req);
  return NextResponse.json(result);
}
