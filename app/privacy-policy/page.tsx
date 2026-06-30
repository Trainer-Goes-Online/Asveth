'use client';

import React from 'react';
import LegalPage from '../../components/LegalPage';
import { SUPPORT_EMAIL } from '../../lib/siteConfig';

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Your privacy matters to us. This page explains what information we collect when you book a Health Audit and how we use it."
      sections={[
        {
          heading: 'What we collect',
          body: (
            <p>
              When you fill out our form or book a call, we collect details like your
              name, email address, and phone number. If you make a payment, it is
              processed securely by our payment provider — we never see or store your
              full card details.
            </p>
          ),
        },
        {
          heading: 'How we use your information',
          body: (
            <p>
              We use your details to confirm your booking, send you your call link and
              reminders, and contact you about your Health Audit. That&apos;s it — we
              don&apos;t use your data for anything you didn&apos;t sign up for.
            </p>
          ),
        },
        {
          heading: 'Sharing your information',
          body: (
            <p>
              We don&apos;t sell your information. We only share it with trusted services
              that help us run things — like our scheduling and payment tools — and only
              so they can do their job.
            </p>
          ),
        },
        {
          heading: 'Keeping your data safe',
          body: (
            <p>
              We take reasonable steps to protect your information. While no method of
              storage is ever 100% secure, we work to keep your details safe and only
              keep them as long as we need them.
            </p>
          ),
        },
        {
          heading: 'Your choices',
          body: (
            <p>
              You can ask us to update or delete your information at any time. Just reach
              out and we&apos;ll take care of it.
            </p>
          ),
        },
        {
          heading: 'Contact us',
          body: (
            <p>
              Questions about your privacy? Email us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
