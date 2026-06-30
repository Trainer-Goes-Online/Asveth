'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PRICE_DISPLAY } from '../lib/siteConfig';
import { COUNTRIES, DEFAULT_COUNTRY, sendFormLead } from '../lib/tracking';
import { validateName, validateEmail, validatePhone, findCountry, phoneDigits } from '../lib/validation';

interface QuizPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  countryIso: string;
  phone: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

// Quiz questions — single source of truth, used both to render the steps and to
// build the readable question→answer payload sent to the form webhook.
const QUIZ = [
  {
    question: 'What has stopped you from getting in shape until now?',
    options: [
      { val: 'guidance', text: "I didn't have the right guidance" },
      { val: 'time', text: 'I have no time with my busy schedule' },
      { val: 'consistency', text: "I've tried before but couldn't stay consistent" },
      { val: 'afford', text: "I didn't think I could afford it" },
    ],
  },
  {
    question: 'Have you tried any fitness program, coach or diet before?',
    options: [
      { val: 'first', text: 'No, this would be my first time' },
      { val: 'quit', text: "Yes — but I quit or it didn't work" },
      { val: 'lost', text: 'Yes — it worked but I lost progress after stopping' },
    ],
  },
  {
    question: 'What is your #1 goal from this program?',
    options: [
      { val: 'lean', text: 'Lose weight & get lean' },
      { val: 'muscle', text: 'Build muscle & look athletic' },
      { val: 'energy', text: 'Improve energy, stamina & performance' },
      { val: 'recomp', text: 'Complete body recomposition — lose fat & build muscle together' },
    ],
  },
];

const DETAILS_STEP = QUIZ.length; // step index of the details form
const CONFIRM_STEP = QUIZ.length + 1; // step index of the confirmation screen
const TOTAL_SEGMENTS = QUIZ.length + 2;

const QuizPopup: React.FC<QuizPopupProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', countryIso: DEFAULT_COUNTRY.iso, phone: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setAnswers({});
      setFormData({ name: '', email: '', countryIso: DEFAULT_COUNTRY.iso, phone: '' });
      setFormErrors({});
      setSubmitting(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleOptionClick = (step: string, value: string) => {
    setAnswers(prev => ({ ...prev, [step]: value }));
  };

  const handleNext = (nextStep: number, validation?: () => boolean) => {
    if (validation && !validation()) return;
    setCurrentStep(nextStep);
  };

  const validateStep = (step: number): boolean => {
    return !!answers[step.toString()];
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear the error for this field as the user corrects it. Changing the
    // country also clears any (now stale) phone error.
    setFormErrors(prev => ({
      ...prev,
      [field]: undefined,
      ...(field === 'countryIso' ? { phone: undefined } : {}),
    }));
  };

  const validateDetails = (): FormErrors => {
    const errors: FormErrors = {};
    // Strict validation — same rules as the checkout form (shared helpers).
    const nameErr = validateName(formData.name, 'full name');
    if (nameErr) errors.name = nameErr;
    const emailErr = validateEmail(formData.email, true); // required + valid format
    if (emailErr) errors.email = emailErr;
    const phoneErr = validatePhone(formData.phone, formData.countryIso);
    if (phoneErr) errors.phone = phoneErr;
    return errors;
  };

  const handleSubmitDetails = () => {
    const errors = validateDetails();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    const fullName = formData.name.trim();
    const firstName = fullName.split(/\s+/)[0] || '';
    const lastName = fullName.split(/\s+/).slice(1).join(' ');
    const country = findCountry(formData.countryIso);
    const fullPhone = `${country.dial}${phoneDigits(formData.phone)}`;

    // Build readable question→answer pairs for Pabbly mapping.
    const quizExtra: Record<string, string> = {};
    QUIZ.forEach((q, idx) => {
      const selected = q.options.find((o) => o.val === answers[String(idx)]);
      quizExtra[`question_${idx + 1}`] = q.question;
      quizExtra[`answer_${idx + 1}`] = selected ? selected.text : '';
    });

    // Persist the lead so the checkout page can prefill / reference it.
    // Store both the full E.164 phone (for reference) and the national number
    // + country so the checkout can prefill the right country and digits.
    try {
      localStorage.setItem(
        'healthAuditLead',
        JSON.stringify({
          name: fullName,
          firstName,
          lastName,
          email: formData.email.trim(),
          phone: fullPhone,
          phone_national: phoneDigits(formData.phone),
          country_code: country.iso,
          quiz: answers,
          submittedAt: new Date().toISOString(),
        })
      );
    } catch {
      /* ignore storage errors */
    }

    // Fire the top-of-funnel lead to FORM_PABBLY_WEBHOOK with the quiz Q&A.
    // keepalive ensures it completes even as we navigate to /checkout.
    sendFormLead({
      event_name: 'QuizLead',
      first_name: firstName,
      last_name: lastName,
      email: formData.email.trim(),
      phone: fullPhone,
      country_code: country.iso,
      amount: 0,
      extra: quizExtra,
    });

    // Redirect to the checkout page after successful submission
    router.push('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        /* ── OVERLAY ── */
        .qpop-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0,0,0,0.82);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        /* ── MODAL ── */
        .qpop-modal {
          width: 100%;
          max-width: 460px;
          background: #14161e;
          border-radius: 16px;
          border: 1px solid rgba(249,115,22,0.2);
          box-shadow: 0 0 80px rgba(249,115,22,0.12), 0 32px 64px rgba(0,0,0,0.7);
          overflow: hidden;
          position: relative;
          animation: qpopIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes qpopIn {
          from { opacity:0; transform: scale(0.92) translateY(16px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }

        /* ── PROGRESS BAR ── */
        .qpop-progress {
          display: flex;
          gap: 5px;
          padding: 18px 52px 0 20px;
        }
        .qpop-seg {
          flex: 1;
          height: 3px;
          border-radius: 100px;
          background: rgba(255,255,255,0.1);
          transition: background 0.35s ease;
        }
        .qpop-seg.done { background: #f97316; }
        .qpop-seg.active { background: linear-gradient(90deg, #f97316, #fbbf24); }

        /* ── CLOSE BTN ── */
        .qpop-close {
          position: absolute;
          top: 14px;
          right: 16px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .qpop-close:hover { background: rgba(255,255,255,0.13); color: #fff; }

        /* ── STEP BODY ── */
        .qpop-step { display: none; }
        .qpop-step.active { display: block; }

        .qpop-body {
          padding: 22px 20px 0;
        }
        .qpop-q {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 18px;
          text-transform: uppercase;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 18px;
          letter-spacing: 0.3px;
        }

        /* ── RADIO OPTIONS ── */
        .qpop-options { display: flex; flex-direction: column; gap: 8px; }

        .qpop-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          user-select: none;
        }
        .qpop-option:hover {
          border-color: rgba(249,115,22,0.3);
          background: rgba(249,115,22,0.05);
        }
        .qpop-option.selected {
          border-color: rgba(249,115,22,0.6);
          background: rgba(249,115,22,0.09);
        }

        .qpop-radio {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          flex-shrink: 0;
          position: relative;
          transition: border-color 0.2s;
        }
        .qpop-option.selected .qpop-radio {
          border-color: #f97316;
        }
        .qpop-option.selected .qpop-radio::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f97316;
        }
        .qpop-option-text {
          font-size: 13.5px;
          color: #d0d0d0;
          font-weight: 500;
          line-height: 1.4;
        }
        .qpop-option.selected .qpop-option-text { color: #fff; }

        /* ── STEP 4: FORM ── */
        .qpop-form-header {
          padding: 22px 20px 0;
        }
        .qpop-form-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 18px;
          text-transform: uppercase;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 4px;
        }
        .qpop-form-sub {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .qpop-form-sub span { color: #f97316; }
        .qpop-fields { padding: 0 20px; display: flex; flex-direction: column; gap: 12px; }
        .qpop-field-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 5px;
        }
        .qpop-field-req { color: var(--accent); }
        .qpop-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 13.5px;
          color: #fff;
          font-family: 'Barlow', sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        .qpop-input::placeholder { color: rgba(255,255,255,0.25); }
        .qpop-input:focus { border-color: rgba(249,115,22,0.5); }
        .qpop-input-error { border-color: rgba(239,68,68,0.8) !important; }

        /* ── PHONE ROW (country code + number) ── */
        .qpop-phone-row { display: flex; align-items: stretch; gap: 8px; }
        .qpop-dial {
          flex: 0 0 auto;
          width: 98px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px 8px;
          font-size: 13px;
          color: #fff;
          font-family: 'Barlow', sans-serif;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .qpop-dial:focus { border-color: rgba(249,115,22,0.5); }
        .qpop-dial option { background: #14161e; color: #fff; }
        .qpop-phone-input {
          flex: 1;
          min-width: 0;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 13.5px;
          color: #fff;
          font-family: 'Barlow', sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        .qpop-phone-input::placeholder { color: rgba(255,255,255,0.25); }
        .qpop-phone-input:focus { border-color: rgba(249,115,22,0.5); }
        .qpop-phone-row.qpop-input-error .qpop-dial,
        .qpop-phone-row.qpop-input-error .qpop-phone-input {
          border-color: rgba(239,68,68,0.8);
        }
        .qpop-error-msg {
          margin-top: 5px;
          font-size: 11.5px;
          color: #fca5a5;
          line-height: 1.3;
        }
        .qpop-next:disabled { opacity: 0.6; cursor: progress; }
        .qpop-privacy {
          font-size: 11px;
          color: var(--muted);
          text-align: center;
          padding: 8px 20px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        /* ── STEP 5: CONFIRMATION ── */
        .qpop-confirm {
          padding: 22px 20px 0;
          text-align: center;
        }
        .qpop-confirm-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(249,115,22,0.2), rgba(251,191,36,0.1));
          border: 1px solid rgba(249,115,22,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin: 0 auto 14px;
        }
        .qpop-confirm-tag {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #fbbf24;
          background: rgba(251,191,36,0.1);
          border: 1px solid rgba(251,191,36,0.25);
          padding: 4px 12px;
          border-radius: 100px;
          margin-bottom: 12px;
        }
        .qpop-price-box {
          margin: 0 0 14px;
          padding: 20px 18px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(249,115,22,0.2);
          border-radius: 12px;
        }
        .qpop-price {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 46px;
          line-height: 1;
          background: linear-gradient(90deg, #f97316, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }
        .qpop-price-label {
          font-size: 11.5px;
          color: var(--muted);
          margin-bottom: 14px;
        }
        .qpop-checklist {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 7px;
          text-align: left;
          margin-bottom: 12px;
        }
        .qpop-checklist li {
          font-size: 12.5px;
          color: #c8ccd6;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .qpop-checklist li::before {
          content: '✓';
          color: #fbbf24;
          font-weight: 700;
          font-size: 12px;
          flex-shrink: 0;
        }
        .qpop-note {
          font-size: 11px;
          color: var(--muted);
          text-align: center;
          margin-bottom: 2px;
        }
        .qpop-book-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: linear-gradient(90deg, #f97316, #fb923c, #fbbf24);
          background-size: 200% auto;
          color: #000;
          font-family: 'Barlow', sans-serif;
          font-weight: 700;
          font-size: 15px;
          padding: 16px 24px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 0 30px rgba(249,115,22,0.45), 0 4px 20px rgba(0,0,0,0.4);
          transition: transform 0.2s, box-shadow 0.2s, background-position 0.4s;
          animation: btnGlow 2.5s ease-in-out infinite;
          margin: 0 20px;
          width: calc(100% - 40px);
        }
        .qpop-book-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(249,115,22,0.7), 0 8px 30px rgba(0,0,0,0.5);
          background-position: right center;
        }

        /* ── FOOTER BAR ── */
        .qpop-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          margin-top: 18px;
          background: linear-gradient(90deg, #f59e0b, #f97316);
          cursor: pointer;
        }
        .qpop-footer-only-next {
          justify-content: flex-end;
        }
        .qpop-back {
          font-family: 'Barlow', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: rgba(0,0,0,0.7);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: color 0.2s;
        }
        .qpop-back:hover { color: #000; }
        .qpop-next {
          font-family: 'Barlow', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #000;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: gap 0.2s;
        }
        .qpop-next:hover { gap: 10px; }

        /* confirm footer is different */
        .qpop-footer-confirm {
          padding: 14px 20px 18px;
          margin-top: 4px;
          background: transparent;
        }
      `}</style>

      <div className="qpop-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="qpop-modal">
          {/* Close */}
          <button className="qpop-close" onClick={onClose}>✕</button>

          {/* Progress Bar */}
          <div className="qpop-progress">
            {Array.from({ length: TOTAL_SEGMENTS }, (_, i) => (
              <div
                key={i}
                className={`qpop-seg ${
                  i < currentStep ? 'done' : i === currentStep ? 'active' : ''
                }`}
              />
            ))}
          </div>

          {/* ── QUIZ STEPS (data-driven) ── */}
          {QUIZ.map((q, idx) => (
            <div key={idx} className={`qpop-step ${currentStep === idx ? 'active' : ''}`}>
              <div className="qpop-body">
                <div className="qpop-q">{q.question}</div>
                <div className="qpop-options">
                  {q.options.map((option, oIdx) => (
                    <div
                      key={oIdx}
                      className={`qpop-option ${answers[String(idx)] === option.val ? 'selected' : ''}`}
                      onClick={() => handleOptionClick(String(idx), option.val)}
                    >
                      <div className="qpop-radio"></div>
                      <div className="qpop-option-text">{option.text}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`qpop-footer ${idx === 0 ? 'qpop-footer-only-next' : ''}`}>
                {idx > 0 && (
                  <button className="qpop-back" onClick={() => setCurrentStep(idx - 1)}>← BACK</button>
                )}
                <button
                  className="qpop-next"
                  onClick={() => handleNext(idx + 1, () => validateStep(idx))}
                >
                  NEXT →
                </button>
              </div>
            </div>
          ))}

          {/* ── DETAILS STEP ── */}
          <div className={`qpop-step ${currentStep === DETAILS_STEP ? 'active' : ''}`}>
            <div className="qpop-form-header">
              <div className="qpop-form-title">Great! One last step — your details</div>
              <div className="qpop-form-sub"><span>⏱</span> Almost done — we need this to book your call</div>
            </div>
            <div className="qpop-fields">
              <div>
                <div className="qpop-field-label">Full Name <span className="qpop-field-req">*</span></div>
                <input
                  className={`qpop-input ${formErrors.name ? 'qpop-input-error' : ''}`}
                  id="qpopName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
                {formErrors.name && <div className="qpop-error-msg">{formErrors.name}</div>}
              </div>
              <div>
                <div className="qpop-field-label">Email <span className="qpop-field-req">*</span></div>
                <input
                  className={`qpop-input ${formErrors.email ? 'qpop-input-error' : ''}`}
                  id="qpopEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                />
                {formErrors.email && <div className="qpop-error-msg">{formErrors.email}</div>}
              </div>
              <div>
                <div className="qpop-field-label">Phone Number <span className="qpop-field-req">*</span></div>
                <div className={`qpop-phone-row ${formErrors.phone ? 'qpop-input-error' : ''}`}>
                  <select
                    className="qpop-dial"
                    aria-label="Country code"
                    value={formData.countryIso}
                    onChange={(e) => handleFieldChange('countryIso', e.target.value)}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.iso} value={c.iso}>
                        {c.flag} {c.dial}
                      </option>
                    ))}
                  </select>
                  <input
                    className="qpop-phone-input"
                    id="qpopPhone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                  />
                </div>
                {formErrors.phone && <div className="qpop-error-msg">{formErrors.phone}</div>}
              </div>
            </div>
            <div className="qpop-privacy">🔒 We'll only contact you about your fitness plan</div>
            <div className="qpop-footer">
              <button className="qpop-back" onClick={() => setCurrentStep(DETAILS_STEP - 1)}>← BACK</button>
              <button
                className="qpop-next"
                onClick={handleSubmitDetails}
                disabled={submitting}
              >
                {submitting ? 'PROCESSING…' : 'SUBMIT →'}
              </button>
            </div>
          </div>

          {/* ── CONFIRMATION STEP ── */}
          <div className={`qpop-step ${currentStep === CONFIRM_STEP ? 'active' : ''}`}>
            <div className="qpop-confirm">
              <div className="qpop-confirm-icon">🎯</div>
              <div className="qpop-confirm-tag">Health Audit</div>
              <div className="qpop-price-box">
                <div className="qpop-price">{PRICE_DISPLAY}</div>
                <div className="qpop-price-label">Adjusted against program fee if you join</div>
                <ul className="qpop-checklist">
                  <li>Complete health assessment consultation</li>
                  <li>Personalised testing and action roadmap</li>
                  <li>Health gap identification</li>
                </ul>
                <div className="qpop-note">Paid consultation · Fully dedicated to your assessment</div>
              </div>
            </div>
            <div className="qpop-footer-confirm">
              <a href="/checkout" className="qpop-book-btn">
                Book My Health Audit Now →
              </a>
              <div style={{textAlign:'center',marginTop:'10px',fontSize:'11px',color:'var(--muted)'}}>
                Full refund if no clarity · No spam · No pressure
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default QuizPopup;