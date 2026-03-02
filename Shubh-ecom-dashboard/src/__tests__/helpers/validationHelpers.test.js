/**
 * Unit Tests: src/helpers/validationHelpers.js
 * Tests: validateIndianPhone, formatPhoneInput, validateEmail, sanitizeInput, isRequired, formatErrorMessages
 */
import {
  validateIndianPhone,
  formatPhoneInput,
  validateEmail,
  sanitizeInput,
  isRequired,
  formatErrorMessages,
} from '@/helpers/validationHelpers';

describe('validateIndianPhone()', () => {
  it('returns true for a valid Indian number starting with 9', () => {
    expect(validateIndianPhone('9876543210')).toBe(true);
  });

  it('returns true for a valid Indian number starting with 6', () => {
    expect(validateIndianPhone('6000000000')).toBe(true);
  });

  it('returns false for an invalid number starting with 5', () => {
    expect(validateIndianPhone('5000000000')).toBe(false);
  });

  it('returns false for a number with fewer than 10 digits', () => {
    expect(validateIndianPhone('987654321')).toBe(false);
  });

  it('returns false for a number with more than 10 digits', () => {
    expect(validateIndianPhone('98765432101')).toBe(false);
  });

  it('returns true (empty allowed) for an empty string', () => {
    expect(validateIndianPhone('')).toBe(true);
  });

  it('returns true for undefined/null (empty allowed)', () => {
    expect(validateIndianPhone(null)).toBe(true);
    expect(validateIndianPhone(undefined)).toBe(true);
  });

  it('strips non-digit characters before validation', () => {
    // "+91 9876543210" → cleaned to "919876543210" (11 digits, starts with 9) → fails
    expect(validateIndianPhone('+91 9876543210')).toBe(false);
    // "9876543210" with spaces → cleaned to "9876543210" → passes
    expect(validateIndianPhone('98765 43210')).toBe(true);
  });
});

describe('formatPhoneInput()', () => {
  it('removes all non-digit characters', () => {
    expect(formatPhoneInput('+91-9876543210')).toBe('919876543210');
  });

  it('leaves a pure digit string unchanged', () => {
    expect(formatPhoneInput('9876543210')).toBe('9876543210');
  });

  it('returns an empty string for empty input', () => {
    expect(formatPhoneInput('')).toBe('');
  });
});

describe('validateEmail()', () => {
  it('returns true for a valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('returns false for an email missing the @ symbol', () => {
    expect(validateEmail('testexample.com')).toBe(false);
  });

  it('returns false for an email missing domain extension', () => {
    expect(validateEmail('test@example')).toBe(false);
  });

  it('returns true (empty allowed) for an empty string', () => {
    expect(validateEmail('')).toBe(true);
  });

  it('returns false for an email with spaces', () => {
    expect(validateEmail('test @example.com')).toBe(false);
  });
});

describe('sanitizeInput()', () => {
  it('trims leading and trailing whitespace from strings', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('returns the original value for non-string types', () => {
    expect(sanitizeInput(42)).toBe(42);
    expect(sanitizeInput(null)).toBe(null);
    expect(sanitizeInput(undefined)).toBe(undefined);
  });

  it('does not affect a string without extra whitespace', () => {
    expect(sanitizeInput('hello')).toBe('hello');
  });
});

describe('isRequired()', () => {
  it('returns false for null', () => {
    expect(isRequired(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isRequired(undefined)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isRequired('')).toBe(false);
  });

  it('returns false for a whitespace-only string', () => {
    expect(isRequired('   ')).toBe(false);
  });

  it('returns true for a non-empty string', () => {
    expect(isRequired('hello')).toBe(true);
  });

  it('returns true for a number (including 0)', () => {
    expect(isRequired(0)).toBe(true);
    expect(isRequired(42)).toBe(true);
  });

  it('returns true for a non-empty array or object', () => {
    expect(isRequired([])).toBe(true);
    expect(isRequired({})).toBe(true);
  });
});

describe('formatErrorMessages()', () => {
  it('returns an empty array for null/undefined', () => {
    expect(formatErrorMessages(null)).toEqual([]);
    expect(formatErrorMessages(undefined)).toEqual([]);
  });

  it('returns an empty array for non-object input', () => {
    expect(formatErrorMessages('error')).toEqual([]);
  });

  it('formats a single field error correctly', () => {
    const errors = { email: 'is required' };
    expect(formatErrorMessages(errors)).toEqual(['Email: is required']);
  });

  it('splits camelCase field names with spaces', () => {
    const errors = { phoneNumber: 'must be 10 digits' };
    const result = formatErrorMessages(errors);
    expect(result).toEqual(['Phone Number: must be 10 digits']);
  });

  it('formats multiple errors into separate formatted strings', () => {
    const errors = { name: 'is required', email: 'is invalid' };
    const result = formatErrorMessages(errors);
    expect(result).toHaveLength(2);
    expect(result).toContain('Name: is required');
    expect(result).toContain('Email: is invalid');
  });
});
