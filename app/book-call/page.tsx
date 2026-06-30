'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import PageShell from '../../components/PageShell';
import { CALENDLY_URL } from '../../lib/siteConfig';

interface Lead {
  name?: string;
  email?: string;
}

export default function BookCallPage() {
  const router = useRouter();
  const [lead, setLead] = useState<Lead>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem('healthAuditLead');
      if (raw) setLead(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Listen for Calendly's "event scheduled" postMessage and move to Thank You.
  useEffect(() => {
    const isCalendlyEvent = (e: MessageEvent) =>
      e.data?.event && typeof e.data.event === 'string' && e.data.event.indexOf('calendly') === 0;

    const onMessage = (e: MessageEvent) => {
      if (isCalendlyEvent(e) && e.data.event === 'calendly.event_scheduled') {
        router.push('/thank-you');
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [router]);

  // Prefill name/email into the Calendly widget when available.
  const prefillQuery = (() => {
    const params = new URLSearchParams();
    if (lead.name) params.set('name', lead.name);
    if (lead.email) params.set('email', lead.email);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  })();

  return (
    <PageShell>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />

      <div className="book-head">
        <p className="ck-eyebrow">Payment Confirmed ✓</p>
        <h1 className="ck-title">Pick a Time for Your Health Audit</h1>
        <p className="ck-lead">
          Choose a slot that works for you below. You&apos;ll get a confirmation email
          with the Zoom link the moment you book.
        </p>
      </div>

      <div
        className="calendly-inline-widget"
        data-url={`${CALENDLY_URL}${prefillQuery}`}
        style={{ minWidth: '320px', height: '720px' }}
      />

      <p className="book-fallback">
        Calendar not loading?{' '}
        <a href={CALENDLY_URL} target="_blank" rel="noreferrer">
          Open the booking page in a new tab
        </a>
        .
      </p>

      <div className="book-cover">
        <p className="book-cover-title">What we&apos;ll cover on your call</p>
        <ul className="book-cover-list">
          <li>
            <strong>A real assessment, not a sales pitch</strong> — we go through your
            symptoms, injury history, and eating patterns.
          </li>
          <li>
            <strong>The exact blood markers to test</strong> — D3, testosterone, thyroid,
            HbA1c, B12 — and what each one tells us.
          </li>
          <li>
            <strong>Your health gaps, identified</strong> — the hidden internal blocks
            that have been holding your body back.
          </li>
          <li>
            <strong>A personalised roadmap</strong> — clear, specific next steps tailored
            to you, not a generic plan.
          </li>
        </ul>
      </div>
    </PageShell>
  );
}
