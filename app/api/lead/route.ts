import { NextRequest, NextResponse } from 'next/server';

// Receives the lead/purchase payload from the client, enriches it with the
// client IP (only available server-side), and forwards everything to the
// Pabbly Connect webhook configured via PABBLY_WEBHOOK_URL.
export async function POST(req: NextRequest) {
  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  // Best-effort client IP from common proxy headers.
  const fwd = req.headers.get('x-forwarded-for') || '';
  const clientIp =
    fwd.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    req.ip ||
    '';

  const payload = {
    ...body,
    client_ip_address: clientIp,
    client_user_agent: body.client_user_agent || req.headers.get('user-agent') || '',
  };

  const webhookUrl = process.env.PABBLY_WEBHOOK_URL;

  // No webhook configured yet — don't break the user flow, just acknowledge.
  if (!webhookUrl) {
    return NextResponse.json({ ok: true, forwarded: false, reason: 'PABBLY_WEBHOOK_URL not set' });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return NextResponse.json({ ok: res.ok, forwarded: true, status: res.status });
  } catch (err) {
    // Never block the funnel on a webhook failure.
    return NextResponse.json({ ok: false, forwarded: false, error: String(err) });
  }
}
