'use client';

import React from 'react';
import Link from 'next/link';
import PageShell from '../../components/PageShell';

export default function ThankYouPage() {
  const steps = [
    'Check your inbox for the confirmation email + Zoom link.',
    'Add the call to your calendar so you don’t miss it.',
    'Show up on time — bring any recent blood reports if you have them.',
  ];

  const uncovers = [
    'Which blood markers are quietly working against you',
    'The hidden internal blocks generic coaching always misses',
    'A clear, personalised roadmap built around your body',
  ];

  return (
    <PageShell width="narrow">
      <div className="ty-wrap">
        <div className="ty-icon">✓</div>
        <p className="ck-eyebrow">You&apos;re All Set</p>
        <h1 className="ck-title">Your Health Audit Is Booked</h1>
        <p className="ck-lead">
          That&apos;s the hard part done. Your slot is locked in and a confirmation
          is on its way to your email. Here&apos;s what happens next:
        </p>

        <ul className="ty-steps">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="ty-step-num">{i + 1}</span>
              {s}
            </li>
          ))}
        </ul>

        {/* Value reinforcement based on landing-page copy */}
        <div className="ty-uncover">
          <p className="ty-uncover-title">On the call, you&apos;ll walk away knowing</p>
          <ul className="ty-uncover-list">
            {uncovers.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>

        <p className="ty-note">
          Need to reschedule? Use the link in your confirmation email — no problem at all.
        </p>

        <Link href="/" className="ty-home-btn">
          Back to Home
        </Link>
      </div>
    </PageShell>
  );
}
