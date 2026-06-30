'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import PageShell from '../../components/PageShell';
import {
  PRICE,
  PRICE_DISPLAY,
  PRICE_PAISE,
  CURRENCY,
  RAZORPAY_KEY_ID,
  BRAND_NAME,
  PRODUCT_NAME,
  FREE_COUPON_CODE,
} from '../../lib/siteConfig';
import { COUNTRIES, DEFAULT_COUNTRY, confirmPurchase, newPurchaseEventId } from '../../lib/tracking';
import { validateName, validateEmail, validatePhone } from '../../lib/validation';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  countryIso: string;
  phone: string;
  city: string;
}

interface CheckoutErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [form, setForm] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    email: '',
    countryIso: DEFAULT_COUNTRY.iso,
    phone: '',
    city: '',
  });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Coupon state
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Prefill from the landing-page popup submission.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('healthAuditLead');
      if (!raw) return;
      const lead = JSON.parse(raw);
      const fullName: string = lead.name || '';
      const iso: string = lead.country_code || DEFAULT_COUNTRY.iso;
      const country = COUNTRIES.find((c) => c.iso === iso) || DEFAULT_COUNTRY;

      // Prefer the stored national number; otherwise strip the exact dial code
      // from the full phone (never a greedy 1–3 digit guess that drops a digit).
      let phone: string = lead.phone_national || '';
      if (!phone && lead.phone) {
        const digits = String(lead.phone).replace(/\D/g, '');
        const dial = country.dial.replace(/\D/g, '');
        phone = dial && digits.startsWith(dial) ? digits.slice(dial.length) : digits;
      }

      setForm((prev) => ({
        ...prev,
        firstName: lead.firstName || fullName.split(/\s+/)[0] || '',
        lastName: lead.lastName || fullName.split(/\s+/).slice(1).join(' ') || '',
        email: lead.email || '',
        countryIso: iso,
        phone,
      }));
    } catch {
      /* ignore */
    }
  }, []);

  const setField = (field: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      // Changing the country clears any (now stale) phone error.
      if (field === 'countryIso') delete next.phone;
      else delete next[field as keyof CheckoutErrors];
      return next;
    });
  };

  const selectedCountry = COUNTRIES.find((c) => c.iso === form.countryIso) || DEFAULT_COUNTRY;

  const isFree = couponApplied; // 100%-off coupon redeemed
  const totalDisplay = isFree ? '₹0' : PRICE_DISPLAY;

  const validate = (): CheckoutErrors => {
    const e: CheckoutErrors = {};
    // Shared, strict validators — identical rules to the quiz/CTA form.
    const fn = validateName(form.firstName, 'first name');
    if (fn) e.firstName = fn;
    const ln = validateName(form.lastName, 'last name', 1);
    if (ln) e.lastName = ln;
    const em = validateEmail(form.email, true);
    if (em) e.email = em;
    const ph = validatePhone(form.phone, form.countryIso); // per-country digit count
    if (ph) e.phone = ph;
    if (!form.city.trim()) e.city = 'City is required.';
    else if (form.city.trim().length < 2) e.city = 'Enter a valid city.';
    return e;
  };

  const applyCoupon = () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponMsg({ text: 'Enter a coupon code first.', ok: false });
      return;
    }
    if (code.toUpperCase() === FREE_COUPON_CODE.toUpperCase()) {
      setCouponApplied(true);
      setCouponMsg({ text: '🎉 Coupon applied — 100% off! Your call is on us.', ok: true });
    } else {
      setCouponApplied(false);
      setCouponMsg({ text: 'That coupon code isn’t valid.', ok: false });
    }
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponInput('');
    setCouponMsg(null);
  };

  const fullPhone = () => `${selectedCountry.dial}${form.phone.replace(/[^\d]/g, '')}`;

  const persistLead = () => {
    try {
      localStorage.setItem(
        'healthAuditLead',
        JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: fullPhone(),
          city: form.city.trim(),
          country_code: selectedCountry.iso,
        })
      );
    } catch {
      /* ignore */
    }
  };

  // Builds the Purchase lead fields. The webhook itself is fired ONLY by the
  // server (/api/razorpay-verify) after it verifies the Razorpay signature
  // (or the coupon). The client can never fire the purchase webhook directly.
  const purchaseFields = (opts: {
    amount: number;
    purchaseEventId: string;
    couponCode?: string;
  }) => ({
    event_name: 'Purchase',
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    email: form.email.trim(),
    phone: fullPhone(),
    city: form.city.trim(),
    country_code: selectedCountry.iso,
    amount: opts.amount,
    purchase_event_id: opts.purchaseEventId,
    coupon_code: opts.couponCode ?? '',
  });

  const handlePay = async () => {
    setPayError(null);

    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      setPayError('Please fix the highlighted fields above.');
      return;
    }

    persistLead();
    const purchaseEventId = newPurchaseEventId();

    // ── 100%-off coupon path: no Razorpay needed; the server re-validates the
    //    coupon before firing the purchase webhook. ──
    if (isFree) {
      setLoading(true);
      const couponCode = couponInput.trim() || FREE_COUPON_CODE;
      const result = await confirmPurchase({
        mode: 'coupon',
        coupon_code: couponCode,
        fields: purchaseFields({ amount: 0, purchaseEventId, couponCode }),
      });
      if (!result.ok || !result.verified) {
        setLoading(false);
        setPayError(result.error || 'Coupon could not be verified. Please try again.');
        return;
      }
      try {
        localStorage.setItem(
          'healthAuditPayment',
          JSON.stringify({
            paymentId: null,
            orderId: null,
            purchaseEventId,
            coupon: couponCode,
            amount: 0,
            paidAt: new Date().toISOString(),
          })
        );
      } catch {
        /* ignore */
      }
      router.push('/book-call');
      return;
    }

    // ── Normal paid path via Razorpay ──
    if (!RAZORPAY_KEY_ID) {
      setPayError(
        'Payment is not configured yet. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local and restart the dev server.'
      );
      return;
    }
    if (!scriptReady || !window.Razorpay) {
      setPayError('Payment library is still loading — please try again in a moment.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/razorpay-order', { method: 'POST' });
      const data = await res.json();

      const options: any = {
        key: RAZORPAY_KEY_ID,
        amount: data.amount ?? PRICE_PAISE,
        currency: data.currency ?? CURRENCY,
        name: BRAND_NAME,
        description: PRODUCT_NAME,
        image: '/athletic-indian-logo.png',
        prefill: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email.trim(),
          contact: fullPhone(),
        },
        notes: { city: form.city.trim(), country: selectedCountry.iso },
        theme: { color: '#f97316' },
        handler: async function (response: any) {
          // Payment reported successful by Razorpay. Send it to the server,
          // which verifies the signature before firing the purchase webhook.
          try {
            localStorage.setItem(
              'healthAuditPayment',
              JSON.stringify({
                paymentId: response.razorpay_payment_id ?? null,
                orderId: response.razorpay_order_id ?? null,
                purchaseEventId,
                amount: PRICE,
                paidAt: new Date().toISOString(),
              })
            );
          } catch {
            /* ignore */
          }
          await confirmPurchase({
            mode: 'razorpay',
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            fields: purchaseFields({ amount: PRICE, purchaseEventId }),
          });
          // The buyer has paid — always take them to booking, regardless of the
          // webhook result (verification gates the webhook, not the UX).
          router.push('/book-call');
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      if (data.orderId) options.order_id = data.orderId;

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setLoading(false);
        setPayError(response?.error?.description || 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      setLoading(false);
      setPayError('Something went wrong starting the payment. Please try again.');
    }
  };

  return (
    <PageShell>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
        strategy="afterInteractive"
      />

      <div className="checkout-grid">
        {/* Details form */}
        <section className="ck-card ck-summary">
          <p className="ck-eyebrow">Secure Checkout</p>
          <h1 className="ck-title">Your Details</h1>
          <p className="ck-lead">
            Enter your details to confirm your {PRODUCT_NAME}. After payment you&apos;ll be
            taken straight to the calendar to pick your slot.
          </p>

          <div className="ck-form">
            <div className="ck-form-row">
              <div className="ck-field">
                <label className="ck-label" htmlFor="ckFirst">
                  First Name <span className="ck-req">*</span>
                </label>
                <input
                  id="ckFirst"
                  className={`ck-input ${errors.firstName ? 'ck-input-error' : ''}`}
                  type="text"
                  autoComplete="given-name"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                />
                {errors.firstName && <div className="ck-field-error">{errors.firstName}</div>}
              </div>

              <div className="ck-field">
                <label className="ck-label" htmlFor="ckLast">
                  Last Name <span className="ck-req">*</span>
                </label>
                <input
                  id="ckLast"
                  className={`ck-input ${errors.lastName ? 'ck-input-error' : ''}`}
                  type="text"
                  autoComplete="family-name"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                />
                {errors.lastName && <div className="ck-field-error">{errors.lastName}</div>}
              </div>
            </div>

            <div className="ck-field">
              <label className="ck-label" htmlFor="ckEmail">
                Email <span className="ck-req">*</span>
              </label>
              <input
                id="ckEmail"
                className={`ck-input ${errors.email ? 'ck-input-error' : ''}`}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
              />
              {errors.email && <div className="ck-field-error">{errors.email}</div>}
            </div>

            <div className="ck-field">
              <label className="ck-label" htmlFor="ckPhone">
                Phone Number <span className="ck-req">*</span>
              </label>
              <div className={`ck-phone ${errors.phone ? 'ck-input-error' : ''}`}>
                <select
                  className="ck-dial"
                  aria-label="Country code"
                  value={form.countryIso}
                  onChange={(e) => setField('countryIso', e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.iso} value={c.iso}>
                      {c.flag} {c.dial}
                    </option>
                  ))}
                </select>
                <input
                  id="ckPhone"
                  className="ck-phone-input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                />
              </div>
              {errors.phone && <div className="ck-field-error">{errors.phone}</div>}
            </div>

            <div className="ck-field">
              <label className="ck-label" htmlFor="ckCity">
                City <span className="ck-req">*</span>
              </label>
              <input
                id="ckCity"
                className={`ck-input ${errors.city ? 'ck-input-error' : ''}`}
                type="text"
                autoComplete="address-level2"
                placeholder="Your city"
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
              />
              {errors.city && <div className="ck-field-error">{errors.city}</div>}
            </div>
          </div>
        </section>

        {/* Order summary + pay */}
        <section className="ck-card ck-pay">
          <ul className="ck-includes">
            {[
              'Live Zoom Health Audit (not a sales call)',
              'Personalised testing & action roadmap',
              'Health gap identification',
              'Full refund if you get no clarity',
            ].map((item, i) => (
              <li key={i}>
                <span className="ck-check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="ck-includes-text">{item}</span>
              </li>
            ))}
          </ul>

          <div className="ck-divider" />

          <div className="ck-row">
            <span>{PRODUCT_NAME}</span>
            <span className={isFree ? 'ck-strike' : ''}>{PRICE_DISPLAY}</span>
          </div>

          <div className="ck-row ck-row--muted">
            <span>Taxes</span>
            <span>Included</span>
          </div>

          {/* ── Muted coupon section (sits just above the total) ── */}
          <div className="ck-coupon">
            {!couponOpen && !couponApplied && (
              <button
                type="button"
                className="ck-coupon-toggle"
                onClick={() => setCouponOpen(true)}
              >
                Have a coupon code?
              </button>
            )}

            {(couponOpen || couponApplied) && !couponApplied && (
              <div className="ck-coupon-row">
                <input
                  className="ck-coupon-input"
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                />
                <button type="button" className="ck-coupon-apply" onClick={applyCoupon}>
                  Apply
                </button>
              </div>
            )}

            {couponApplied && (
              <div className="ck-coupon-chip">
                <span>
                  Coupon <strong>{couponInput.trim().toUpperCase() || FREE_COUPON_CODE}</strong> applied
                </span>
                <button type="button" className="ck-coupon-remove" onClick={removeCoupon}>
                  Remove
                </button>
              </div>
            )}

            {couponMsg && (
              <div className={`ck-coupon-msg ${couponMsg.ok ? 'ok' : 'err'}`}>{couponMsg.text}</div>
            )}
          </div>

          {couponApplied && (
            <div className="ck-row ck-row--muted">
              <span>Discount (100%)</span>
              <span>−{PRICE_DISPLAY}</span>
            </div>
          )}

          <div className="ck-divider" />
          <div className="ck-row ck-row--total">
            <span>Total Amount</span>
            <span>{totalDisplay}</span>
          </div>

          <button className="ck-pay-btn" onClick={handlePay} disabled={loading}>
            {loading
              ? 'Processing…'
              : isFree
              ? 'Confirm & Book My Call'
              : `Pay ${PRICE_DISPLAY} & Book My Call`}
          </button>

          {payError && <p className="ck-error">{payError}</p>}

          <p className="ck-secure">
            {isFree
              ? '✓ No payment needed · 100% money-back guarantee'
              : '🔒 Payments secured by Razorpay · 100% money-back guarantee'}
          </p>
        </section>
      </div>
    </PageShell>
  );
}
