// ──────────────────────────────────────────────────────────────
//  FB-ADS / MARKETING TRACKING
//  Captures the parameters that arrive when a user lands from a
//  Facebook ad, persists them (first-touch), and builds the payload
//  that gets POSTed to /api/lead -> Pabbly webhook.
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
  // client_ip_address is added server-side in /api/lead
}

// ── Country codes for the phone input (common markets, India default) ──
export interface Country {
  iso: string;
  dial: string;
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { iso: 'IN', dial: '+91', name: 'India', flag: '🇮🇳' },
  { iso: 'US', dial: '+1', name: 'United States', flag: '🇺🇸' },
  { iso: 'GB', dial: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { iso: 'AE', dial: '+971', name: 'UAE', flag: '🇦🇪' },
  { iso: 'SG', dial: '+65', name: 'Singapore', flag: '🇸🇬' },
  { iso: 'CA', dial: '+1', name: 'Canada', flag: '🇨🇦' },
  { iso: 'AU', dial: '+61', name: 'Australia', flag: '🇦🇺' },
  { iso: 'FR', dial: '+33', name: 'France', flag: '🇫🇷' },
  { iso: 'DE', dial: '+49', name: 'Germany', flag: '🇩🇪' },
  { iso: 'SA', dial: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { iso: 'QA', dial: '+974', name: 'Qatar', flag: '🇶🇦' },
  { iso: 'MY', dial: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { iso: 'NZ', dial: '+64', name: 'New Zealand', flag: '🇳🇿' },
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
}

/** Build the complete payload (every key present, even if blank). */
export function buildLeadPayload(fields: LeadFields): LeadPayload {
  const t = getTracking();
  return {
    ...t,
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

/** POST the payload to our API route, which enriches with IP and forwards to Pabbly. */
export function sendLead(fields: LeadFields): Promise<void> {
  const payload = buildLeadPayload(fields);
  return fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // keepalive lets the request finish even as we navigate away
    keepalive: true,
  })
    .then(() => undefined)
    .catch(() => undefined);
}

export function newPurchaseEventId(): string {
  return uuid();
}
