// ──────────────────────────────────────────────────────────────
//  FB-ADS / MARKETING TRACKING
//  Captures the parameters that arrive when a user lands from a
//  Facebook ad, persists them (first-touch), and builds the payload
//  POSTed to /api/form-lead (quiz lead) and /api/razorpay-verify (purchase).
// ──────────────────────────────────────────────────────────────

import { PRICE, IS_TEST } from './siteConfig';

const STORAGE_KEY = 'fbTracking';

export interface Tracking {
  lead_id: string;
  external_id: string;
  created_at: string;
  fbc: string;
  fbp: string;
  fbclid: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
}

// Full payload shape sent to the webhook (all keys always present).
export interface LeadPayload extends Tracking {
  event_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  country_code: string;
  client_user_agent: string;
  event_source_url: string;
  amount: number;
  is_test: boolean;
  purchase_event_id: string;
  coupon_code: string;
  payment_id: string;
  order_id: string;
  // client_ip_address is added server-side by the API route forwarder
}

// ── Country codes for the phone input (common markets, India default) ──
// minDigits/maxDigits = allowed length of the NATIONAL number (excluding the
// dial code). Used for strict, country-aware phone validation on both forms.
export interface Country {
  iso: string;
  dial: string;
  name: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
}

export const COUNTRIES: Country[] = [
  { iso: 'IN', dial: '+91', name: 'India', flag: '🇮🇳', minDigits: 10, maxDigits: 10 },
  { iso: 'US', dial: '+1', name: 'United States', flag: '🇺🇸', minDigits: 10, maxDigits: 10 },
  { iso: 'GB', dial: '+44', name: 'United Kingdom', flag: '🇬🇧', minDigits: 10, maxDigits: 10 },
  { iso: 'AE', dial: '+971', name: 'UAE', flag: '🇦🇪', minDigits: 9, maxDigits: 9 },
  { iso: 'SG', dial: '+65', name: 'Singapore', flag: '🇸🇬', minDigits: 8, maxDigits: 8 },
  { iso: 'CA', dial: '+1', name: 'Canada', flag: '🇨🇦', minDigits: 10, maxDigits: 10 },
  { iso: 'AU', dial: '+61', name: 'Australia', flag: '🇦🇺', minDigits: 9, maxDigits: 9 },
  { iso: 'FR', dial: '+33', name: 'France', flag: '🇫🇷', minDigits: 9, maxDigits: 9 },
  { iso: 'DE', dial: '+49', name: 'Germany', flag: '🇩🇪', minDigits: 10, maxDigits: 11 },
  { iso: 'SA', dial: '+966', name: 'Saudi Arabia', flag: '🇸🇦', minDigits: 9, maxDigits: 9 },
  { iso: 'QA', dial: '+974', name: 'Qatar', flag: '🇶🇦', minDigits: 8, maxDigits: 8 },
  { iso: 'MY', dial: '+60', name: 'Malaysia', flag: '🇲🇾', minDigits: 9, maxDigits: 10 },
  { iso: 'NZ', dial: '+64', name: 'New Zealand', flag: '🇳🇿', minDigits: 8, maxDigits: 10 },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
  } catch {
    /* ignore */
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

function emptyTracking(): Tracking {
  return {
    lead_id: '',
    external_id: '',
    created_at: '',
    fbc: '',
    fbp: '',
    fbclid: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
  };
}

/**
 * Capture marketing params on page load. First-touch: existing non-empty
 * values are preserved; only blanks get filled. Safe to call on every page.
 */
export function captureTracking(): Tracking {
  if (typeof window === 'undefined') return emptyTracking();

  let stored = emptyTracking();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = { ...stored, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }

  const params = new URLSearchParams(window.location.search);
  const fromUrl = (k: string) => params.get(k) || '';

  const fbclid = fromUrl('fbclid');

  // fbc: prefer the _fbc cookie set by the Pixel; else derive from fbclid.
  let fbc = readCookie('_fbc');
  if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;

  // fbp: prefer the _fbp cookie; else generate a stable fallback.
  let fbp = readCookie('_fbp');
  if (!fbp) fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 1e10)}`;

  const next: Tracking = {
    lead_id: stored.lead_id || uuid(),
    external_id: stored.external_id || uuid(),
    created_at: stored.created_at || new Date().toISOString(),
    fbclid: stored.fbclid || fbclid,
    fbc: stored.fbc || fbc,
    fbp: stored.fbp || fbp,
    utm_source: stored.utm_source || fromUrl('utm_source'),
    utm_medium: stored.utm_medium || fromUrl('utm_medium'),
    utm_campaign: stored.utm_campaign || fromUrl('utm_campaign'),
    utm_content: stored.utm_content || fromUrl('utm_content'),
    utm_term: stored.utm_term || fromUrl('utm_term'),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function getTracking(): Tracking {
  if (typeof window === 'undefined') return emptyTracking();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyTracking(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  // Nothing stored yet — capture now so we never send blanks.
  return captureTracking();
}

interface LeadFields {
  event_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  country_code?: string;
  purchase_event_id?: string;
  amount?: number;
  coupon_code?: string;
  payment_id?: string;
  order_id?: string;
  // Arbitrary extra fields (e.g. quiz questions + answers) merged into the payload.
  extra?: Record<string, any>;
}

/** Build the complete payload (every key present, even if blank). */
export function buildLeadPayload(fields: LeadFields): LeadPayload & Record<string, any> {
  const t = getTracking();
  return {
    ...t,
    ...(fields.extra ?? {}),
    event_name: fields.event_name,
    first_name: fields.first_name ?? '',
    last_name: fields.last_name ?? '',
    email: fields.email ?? '',
    phone: fields.phone ?? '',
    city: fields.city ?? '',
    country_code: fields.country_code ?? '',
    client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    event_source_url: typeof window !== 'undefined' ? window.location.href : '',
    amount: fields.amount ?? PRICE,
    is_test: IS_TEST,
    purchase_event_id: fields.purchase_event_id ?? '',
    coupon_code: fields.coupon_code ?? '',
    payment_id: fields.payment_id ?? '',
    order_id: fields.order_id ?? '',
  };
}

/**
 * Quiz / CTA form submission → /api/form-lead → FORM_PABBLY_WEBHOOK.
 * Top-of-funnel lead; fired the moment the popup form is submitted.
 */
export function sendFormLead(fields: LeadFields): Promise<void> {
  const payload = buildLeadPayload(fields);
  return fetch('/api/form-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // keepalive lets the request finish even as we navigate to /checkout
    keepalive: true,
  })
    .then(() => undefined)
    .catch(() => undefined);
}

export interface PurchaseVerifyResult {
  ok: boolean;
  verified: boolean;
  error?: string;
}

/**
 * Confirm a purchase server-side → /api/razorpay-verify → PABBLY_WEBHOOK_URL.
 * The server fires the purchase webhook ONLY if the Razorpay signature (or the
 * coupon, in 'coupon' mode) is valid. Returns the verification result so the
 * checkout can decide what to do next.
 */
export async function confirmPurchase(args: {
  fields: LeadFields;
  mode: 'razorpay' | 'coupon';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  coupon_code?: string;
}): Promise<PurchaseVerifyResult> {
  const payload = buildLeadPayload(args.fields);
  try {
    const res = await fetch('/api/razorpay-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: args.mode,
        payload,
        razorpay_order_id: args.razorpay_order_id,
        razorpay_payment_id: args.razorpay_payment_id,
        razorpay_signature: args.razorpay_signature,
        coupon_code: args.coupon_code,
      }),
    });
    const data = await res.json().catch(() => ({} as any));
    return { ok: res.ok && !!data.ok, verified: !!data.verified, error: data.error };
  } catch (err) {
    return { ok: false, verified: false, error: String(err) };
  }
}

export function newPurchaseEventId(): string {
  return uuid();
}
