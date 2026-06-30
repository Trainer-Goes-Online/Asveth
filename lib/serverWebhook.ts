// ──────────────────────────────────────────────────────────────
//  SERVER-SIDE WEBHOOK FORWARDER
//  Shared by the API routes. Enriches the client payload with the
//  real client IP (only available server-side) and POSTs it to the
//  given Pabbly webhook. Never throws — the funnel must not break
//  because a webhook is slow or down.
// ──────────────────────────────────────────────────────────────

import type { NextRequest } from 'next/server';

export function clientIpFrom(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for') || '';
  return (
    fwd.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    // @ts-ignore - req.ip exists on the Node runtime
    (req as any).ip ||
    ''
  );
}

export interface ForwardResult {
  ok: boolean;
  forwarded: boolean;
  status?: number;
  reason?: string;
  error?: string;
}

/**
 * Forward an enriched payload to a webhook URL. Adds client IP + user agent.
 * Returns a structured result; never rejects.
 */
export async function forwardToWebhook(
  webhookUrl: string | undefined,
  payload: Record<string, any>,
  req: NextRequest
): Promise<ForwardResult> {
  const enriched = {
    ...payload,
    client_ip_address: clientIpFrom(req),
    client_user_agent: payload.client_user_agent || req.headers.get('user-agent') || '',
  };

  if (!webhookUrl) {
    return { ok: true, forwarded: false, reason: 'Webhook URL not configured' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
    });
    return { ok: res.ok, forwarded: true, status: res.status };
  } catch (err) {
    return { ok: false, forwarded: false, error: String(err) };
  }
}
