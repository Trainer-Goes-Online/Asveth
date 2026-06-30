'use client';

import React from 'react';
import LegalPage from '../../components/LegalPage';
import { PRICE_DISPLAY, SUPPORT_EMAIL } from '../../lib/siteConfig';

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro="We stand behind the Health Audit. If it doesn't give you clarity, you shouldn't have to pay for it — here's how that works."
      sections={[
        {
          heading: 'Our money-back guarantee',
          body: (
            <p>
              If you complete your Health Audit and walk away without clarity on your next
              steps, just let us know and we&apos;ll refund your {PRICE_DISPLAY} in full.
              No long forms, no hoops to jump through.
            </p>
          ),
        },
        {
          heading: 'How to request a refund',
          body: (
            <p>
              Simply message us or email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> after your call and
              tell us it wasn&apos;t a fit. We&apos;ll process your refund to the original
              payment method.
            </p>
          ),
        },
        {
          heading: 'When refunds apply',
          body: (
            <p>
              The guarantee is for people who show up and take part in the audit. If you
              book but don&apos;t attend, reach out and we&apos;ll help you reschedule
              rather than refund.
            </p>
          ),
        },
        {
          heading: 'Processing time',
          body: (
            <p>
              Once approved, refunds are sent back through our payment provider. Depending
              on your bank, it may take a few business days for the amount to appear.
            </p>
          ),
        },
        {
          heading: 'Contact us',
          body: (
            <p>
              Anything unclear? Email us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we&apos;ll sort
              it out.
            </p>
          ),
        },
      ]}
    />
  );
}
