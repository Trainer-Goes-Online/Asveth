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
import { COUNTRIES, DEFAULT_COUNTRY, sendLead, newPurchaseEventId } from '../../lib/tracking';

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
      setForm((prev) => ({
        ...prev,
        firstName: lead.firstName || fullName.split(/\s+/)[0] || '',
        lastName: lead.lastName || fullName.split(/\s+/).slice(1).join(' ') || '',
        email: lead.email || '',
        phone: (lead.phone || '').replace(/^\+?\d{1,3}[\s-]?/, '') || lead.phone || '',
      }));
    } catch {
      /* ignore */
    }
  }, []);

  const setField = (field: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const selectedCountry = COUNTRIES.find((c) => c.iso === form.countryIso) || DEFAULT_COUNTRY;

  const isFree = couponApplied; // 100%-off coupon redeemed
  const totalDisplay = isFree ? '₹0' : PRICE_DISPLAY;

  const validate = (): CheckoutErrors => {
    const e: CheckoutErrors = {};
    const nameRe = /^[a-zA-Z][a-zA-Z\s.'-]*$/;

    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    else if (form.firstName.trim().length < 2) e.firstName = 'Enter a valid first name.';
    else if (!nameRe.test(form.firstName.trim())) e.firstName = 'Letters only.';

    if (!form.lastName.trim()) e.lastName = 'Last name is required.';
    else if (!nameRe.test(form.lastName.trim())) e.lastName = 'Letters only.';

    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'Enter a valid email address.';

    const digits = form.phone.replace(/[^\d]/g, '');
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    else if (!/^[\d\s-]+$/.test(form.phone.trim())) e.phone = 'Numbers only.';
    else if (digits.length < 6 || digits.length > 14)
      e.phone = 'Enter a valid phone number.';

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

  // Fires the Pabbly webhook — ONLY ever called after a successful payment
  // (real Razorpay success, or a 100%-off coupon which is a successful ₹0 sale).
  const firePurchaseWebhook = (opts: {
    amount: number;
    purchaseEventId: string;
    couponCode?: string;
    paymentId?: string;
    orderId?: string;
  }) => {
    sendLead({
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
      payment_id: opts.paymentId ?? '',
      order_id: opts.orderId ?? '',
    });
  };

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

    // ── 100%-off coupon path: no Razorpay needed, treat as a successful sale ──
    if (isFree) {
      setLoading(true);
      try {
        localStorage.setItem(
          'healthAuditPayment',
          JSON.stringify({
            paymentId: null,
            orderId: null,
            purchaseEventId,
            coupon: FREE_COUPON_CODE,
            amount: 0,
            paidAt: new Date().toISOString(),
          })
        );
      } catch {
        /* ignore */
      }
      firePurchaseWebhook({
        amount: 0,
        purchaseEventId,
        couponCode: couponInput.trim() || FREE_COUPON_CODE,
      });
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
        handler: function (response: any) {
          // Payment confirmed by Razorpay → NOW fire the webhook.
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
          firePurchaseWebhook({
            amount: PRICE,
            purchaseEventId,
            paymentId: response.razorpay_payment_id ?? '',
            orderId: response.razorpay_order_id ?? '',
          });
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
            <li>Live Zoom Health Audit (not a sales call)</li>
            <li>Personalised testing &amp; action roadmap</li>
            <li>Health gap identification</li>
            <li>Full refund if you get no clarity</li>
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
