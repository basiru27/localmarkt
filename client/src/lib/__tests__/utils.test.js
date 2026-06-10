import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  truncateText,
  isValidGambianPhone,
  normalizePhoneForWhatsApp,
  formatGambianPhone,
  isValidEmail,
  looksLikePhoneNumber,
} from '../utils';

describe('formatPrice', () => {
  it('formats zero with currency symbol', () => {
    expect(formatPrice(0)).toMatch(/D\s*0/);
  });

  it('formats whole number with commas', () => {
    expect(formatPrice(1000)).toMatch(/1,000/);
  });

  it('formats large number with commas', () => {
    expect(formatPrice(1000000)).toMatch(/1,000,000/);
  });

  it('formats decimal value', () => {
    const result = formatPrice(1500.5);
    expect(result).toMatch(/1,500/);
    expect(result).toMatch(/D/);
  });

  it('returns fallback for null', () => {
    expect(formatPrice(null)).toMatch(/D/);
  });

  it('returns fallback for NaN', () => {
    expect(formatPrice('not-a-number')).toMatch(/D/);
  });

  it('handles string input', () => {
    expect(formatPrice('500')).toMatch(/500/);
  });
});

describe('truncateText', () => {
  it('returns text unchanged when shorter than max', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis when text exceeds max', () => {
    expect(truncateText('hello world', 5)).toBe('hello...');
  });

  it('returns null for null input', () => {
    expect(truncateText(null, 10)).toBeNull();
  });

  it('returns undefined for undefined input', () => {
    expect(truncateText(undefined, 10)).toBeUndefined();
  });

  it('uses default maxLength of 100', () => {
    const long = 'a'.repeat(150);
    const result = truncateText(long);
    expect(result.length).toBe(103); // 100 + '...'
  });

  it('trims trailing whitespace before ellipsis', () => {
    expect(truncateText('hello world abc', 11)).toBe('hello world...');
  });
});

describe('isValidGambianPhone', () => {
  it('accepts valid +220 number with space', () => {
    expect(isValidGambianPhone('+220 3123456')).toBe(true);
  });

  it('rejects number starting with 1 after +220', () => {
    expect(isValidGambianPhone('+220 1234567')).toBe(false);
  });

  it('rejects plain text', () => {
    expect(isValidGambianPhone('invalid')).toBe(false);
  });

  it('rejects number without +220 prefix', () => {
    expect(isValidGambianPhone('3123456')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidGambianPhone('')).toBe(false);
  });
});

describe('normalizePhoneForWhatsApp', () => {
  it('removes + prefix from +220 number', () => {
    expect(normalizePhoneForWhatsApp('+2203123456')).toBe('2203123456');
  });

  it('passes through 220-prefixed number unchanged', () => {
    expect(normalizePhoneForWhatsApp('2203123456')).toBe('2203123456');
  });

  it('prepends 220 to bare 7-digit number', () => {
    expect(normalizePhoneForWhatsApp('3123456')).toBe('2203123456');
  });

  it('returns null for empty input', () => {
    expect(normalizePhoneForWhatsApp('')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(normalizePhoneForWhatsApp(null)).toBeNull();
  });

  it('handles number with spaces', () => {
    expect(normalizePhoneForWhatsApp('+220 312 3456')).toBe('2203123456');
  });
});

describe('formatGambianPhone', () => {
  it('formats bare digits with +220 prefix', () => {
    expect(formatGambianPhone('3123456')).toBe('+220 3123456');
  });

  it('handles +220-prefixed input', () => {
    expect(formatGambianPhone('+2203123456')).toBe('+220 3123456');
  });

  it('limits to 7 digits', () => {
    expect(formatGambianPhone('3123456789')).toBe('+220 3123456');
  });

  it('strips non-digit characters from number part', () => {
    expect(formatGambianPhone('+220 312-3456')).toBe('+220 3123456');
  });
});

describe('isValidEmail', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects string without @', () => {
    expect(isValidEmail('notanemail')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('looksLikePhoneNumber', () => {
  it('returns true for +220 number', () => {
    expect(looksLikePhoneNumber('+220 3123456')).toBe(true);
  });

  it('returns false for empty input', () => {
    expect(looksLikePhoneNumber('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(looksLikePhoneNumber(null)).toBe(false);
  });

  it('returns true for number with dashes', () => {
    expect(looksLikePhoneNumber('220-312-3456')).toBe(true);
  });
});
