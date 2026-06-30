// ──────────────────────────────────────────────────────────────
//  CENTRAL SITE CONFIG
//  One place that reads env vars. Update .env.local and every
//  page/section that imports from here updates automatically.
// ──────────────────────────────────────────────────────────────

// Health Audit price (a plain number, e.g. 97).
// Edit NEXT_PUBLIC_HEALTH_AUDIT_PRICE in .env.local to change it everywhere.
export const PRICE: number = Number(process.env.NEXT_PUBLIC_HEALTH_AUDIT_PRICE ?? 97);

// Formatted for display in copy: "₹97"
export const PRICE_DISPLAY = `₹${PRICE.toLocaleString('en-IN')}`;

// Razorpay works in the smallest currency unit (paise). ₹97 -> 9700.
export const PRICE_PAISE = Math.round(PRICE * 100);

export const CURRENCY = 'INR';

// Calendly event link embedded on the Book a Call page.
export const CALENDLY_URL: string =
  process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://calendly.com/your-handle/health-audit';

// Razorpay public key (rzp_test_... for testing, rzp_live_... for production).
export const RAZORPAY_KEY_ID: string = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '';

// is_test flag for analytics: true unless a live Razorpay key is configured.
export const IS_TEST: boolean = !RAZORPAY_KEY_ID.startsWith('rzp_live');

// Product / line-item name shown at checkout and in Razorpay.
export const PRODUCT_NAME = 'Health Audit Call';

// Coupon that grants 100% off (case-insensitive). Override via env.
export const FREE_COUPON_CODE: string = (
  process.env.NEXT_PUBLIC_FREE_COUPON_CODE ?? 'FREEAUDIT'
).trim();

// VSL video — full MP4 URL played in the hero section.
// Override via NEXT_PUBLIC_VSL_VIDEO_URL in .env.local if it ever changes.
export const VSL_VIDEO_URL: string =
  process.env.NEXT_PUBLIC_VSL_VIDEO_URL ??
  'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/Asveth/ASVETH%20FINAL%20VSL.mp4';

// Brand
export const BRAND_NAME = 'The Athletic Indian';
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@theathleticindian.com';
