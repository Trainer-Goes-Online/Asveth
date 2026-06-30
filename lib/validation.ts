// ──────────────────────────────────────────────────────────────
//  SHARED FORM VALIDATION
//  Single source of truth used by BOTH the quiz popup (CTA form)
//  and the checkout form, so the rules can never drift apart.
// ──────────────────────────────────────────────────────────────

import { COUNTRIES, DEFAULT_COUNTRY, type Country } from './tracking';

// Reasonably strict email regex: local@domain.tld, no spaces, a real TLD.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Name: starts with a letter, then letters/spaces/.'- (covers most real names).
const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]*$/;

export function findCountry(iso: string): Country {
  return COUNTRIES.find((c) => c.iso === iso) || DEFAULT_COUNTRY;
}

/** Strip everything that isn't a digit. */
export function phoneDigits(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}

/**
 * Validate a name field. `min` defaults to 2.
 * Returns an error string, or '' when valid.
 */
export function validateName(value: string, label = 'name', min = 2): string {
  const v = (value || '').trim();
  if (!v) return `Please enter your ${label}.`;
  if (v.length < min) return `Enter a valid ${label}.`;
  if (!NAME_RE.test(v)) return `${label[0].toUpperCase()}${label.slice(1)} can contain letters only.`;
  return '';
}

/**
 * Validate an email. When `required` is false an empty value passes,
 * but any non-empty value must still be a well-formed address.
 * Returns an error string, or '' when valid.
 */
export function validateEmail(value: string, required = true): string {
  const v = (value || '').trim();
  if (!v) return required ? 'Please enter your email address.' : '';
  if (v.length > 254) return 'Email address is too long.';
  if (!EMAIL_RE.test(v)) return 'Please enter a valid email address (e.g. name@example.com).';
  return '';
}

/**
 * Validate a phone number against the selected country's digit rules.
 * e.g. +91 (India) requires exactly 10 digits.
 * Returns an error string, or '' when valid.
 */
export function validatePhone(rawPhone: string, countryIso: string): string {
  const raw = (rawPhone || '').trim();
  if (!raw) return 'Please enter your phone number.';
  // Allow only digits, spaces, dashes, parens and a single leading +.
  if (!/^\+?[\d\s()-]+$/.test(raw)) return 'Phone number can contain digits only.';

  const country = findCountry(countryIso);
  const digits = phoneDigits(raw);

  if (digits.length < country.minDigits || digits.length > country.maxDigits) {
    const exact = country.minDigits === country.maxDigits;
    const need = exact
      ? `${country.minDigits} digits`
      : `${country.minDigits}–${country.maxDigits} digits`;
    return `Enter a valid ${country.name} number (${need} after ${country.dial}).`;
  }
  return '';
}
