import type { Lang } from './db-types';

export function validateIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Indian phone: starts with +91 or 0, followed by 10 digits starting with 6-9
  const patterns = [
    /^\+91[6-9]\d{9}$/,
    /^0[6-9]\d{9}$/,
    /^[6-9]\d{9}$/,
  ];
  return patterns.some((p) => p.test(cleaned));
}

export function normalizeIndianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) return cleaned;
  if (cleaned.startsWith('0')) return '+91' + cleaned.slice(1);
  if (cleaned.length === 10 && (cleaned[0] ?? '0') >= '6') return '+91' + cleaned;
  return cleaned;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function validateMinLength(value: string, min: number): boolean {
  return value.trim().length >= min;
}

export function getErrorMessage(key: string, lang: Lang): string {
  const errors: Record<string, Record<Lang, string>> = {
    required: {
      en: 'This field is required',
      bn: 'এই তথ্যটি আবশ্যক',
    },
    phone: {
      en: 'Enter a valid 10-digit Indian mobile number',
      bn: 'একটি বৈধ ১০-সংখ্যার ভারতীয় মোবাইল নম্বর লিখুন',
    },
    email: {
      en: 'Enter a valid email address',
      bn: 'একটি বৈধ ইমেল ঠিকানা লিখুন',
    },
    consent: {
      en: 'You must give consent to proceed',
      bn: 'এগিয়ে যেতে সম্মতি দিতে হবে',
    },
    minLength: {
      en: 'Must be at least 3 characters',
      bn: 'কমপক্ষে ৩ অক্ষর হতে হবে',
    },
    password: {
      en: 'Password must be at least 6 characters',
      bn: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
    },
    passwordMismatch: {
      en: 'Passwords do not match',
      bn: 'পাসওয়ার্ড মেলেনি',
    },
  };

  return errors[key]?.[lang] ?? key;
}
