'use client';

import React from 'react';
import LegalPage from '../../components/LegalPage';
import { PRICE_DISPLAY, SUPPORT_EMAIL } from '../../lib/siteConfig';

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="By booking a Health Audit with us, you agree to the following terms. We've kept them simple and straightforward."
      sections={[
        {
          heading: 'What the Health Audit is',
          body: (
            <p>
              The Health Audit is a live, one-on-one diagnostic consultation for{' '}
              {PRICE_DISPLAY}. It&apos;s designed to assess your situation and give you a
              personalised roadmap — it is not a medical diagnosis or treatment, and
              nothing shared during the call is a substitute for professional medical
              advice.
            </p>
          ),
        },
        {
          heading: 'Booking and payment',
          body: (
            <p>
              Your slot is confirmed once payment is received. Please provide accurate
              details when booking so we can reach you and send your call link.
            </p>
          ),
        },
        {
          heading: 'Results',
          body: (
            <p>
              Any results, transformations, or testimonials shown are real but not
              typical. Your outcome depends on your starting point, effort, and
              consistency. We can&apos;t and don&apos;t guarantee specific results.
            </p>
          ),
        },
        {
          heading: 'Rescheduling and no-shows',
          body: (
            <p>
              Need to reschedule? Use the link in your confirmation email. If you miss
              your call without notice, we&apos;ll do our best to fit you in again, but we
              can&apos;t always promise another slot.
            </p>
          ),
        },
        {
          heading: 'Your responsibilities',
          body: (
            <p>
              You&apos;re responsible for any health decisions you make. Always consult a
              qualified doctor before starting any new fitness, nutrition, or testing
              plan — especially if you have an existing medical condition.
            </p>
          ),
        },
        {
          heading: 'Contact us',
          body: (
            <p>
              Questions about these terms? Email us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
