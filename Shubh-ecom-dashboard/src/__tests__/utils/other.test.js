/**
 * Unit Tests: src/utils/other.js
 * Tests: getStockStatus, getRatingVariant, formatFileSize, getRatingStatus
 */
import {
  getStockStatus,
  getRatingVariant,
  formatFileSize,
  getRatingStatus,
} from '@/utils/other';

describe('getStockStatus()', () => {
  it('returns "In Stock" when quantity >= 11', () => {
    expect(getStockStatus(11)).toEqual({ variant: 'success', text: 'In Stock' });
    expect(getStockStatus(100)).toEqual({ variant: 'success', text: 'In Stock' });
  });

  it('returns "Limited" when quantity is between 1 and 10 (inclusive)', () => {
    expect(getStockStatus(1)).toEqual({ variant: 'primary', text: 'Limited' });
    expect(getStockStatus(10)).toEqual({ variant: 'primary', text: 'Limited' });
    expect(getStockStatus(5)).toEqual({ variant: 'primary', text: 'Limited' });
  });

  it('returns "Out of Stock" when quantity is 0 or negative', () => {
    expect(getStockStatus(0)).toEqual({ variant: 'danger', text: 'Out of Stock' });
    expect(getStockStatus(-5)).toEqual({ variant: 'danger', text: 'Out of Stock' });
  });
});

describe('getRatingVariant()', () => {
  it('returns "success" for ratings >= 4', () => {
    expect(getRatingVariant(4)).toBe('success');
    expect(getRatingVariant(5)).toBe('success');
  });

  it('returns "warning" for ratings between 2 (exclusive) and 4 (exclusive)', () => {
    expect(getRatingVariant(3)).toBe('warning');
    expect(getRatingVariant(2.5)).toBe('warning');
  });

  it('returns "danger" for ratings < 2', () => {
    expect(getRatingVariant(1)).toBe('danger');
    expect(getRatingVariant(0)).toBe('danger');
  });
});

describe('formatFileSize()', () => {
  it('returns "0 Bytes" for 0 input', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('converts bytes within the Bytes range', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('converts bytes to KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('converts bytes to MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });

  it('converts bytes to GB', () => {
    expect(formatFileSize(1024 ** 3)).toBe('1 GB');
  });

  it('respects the decimals parameter', () => {
    expect(formatFileSize(1536, 1)).toBe('1.5 KB');
    expect(formatFileSize(1536, 0)).toBe('2 KB');
  });
});

describe('getRatingStatus()', () => {
  it('returns "Excellent" for rating > 4', () => {
    expect(getRatingStatus(4.5)).toBe('Excellent');
    expect(getRatingStatus(5)).toBe('Excellent');
  });

  it('returns "Best" for rating between 3 (exclusive) and 4 (inclusive)', () => {
    expect(getRatingStatus(4)).toBe('Best');
    expect(getRatingStatus(3.5)).toBe('Best');
  });

  it('returns "Good" for rating between 2 (exclusive) and 3 (inclusive)', () => {
    expect(getRatingStatus(3)).toBe('Good');
    expect(getRatingStatus(2.5)).toBe('Good');
  });

  it('returns "Bad" for rating <= 2', () => {
    expect(getRatingStatus(2)).toBe('Bad');
    expect(getRatingStatus(1)).toBe('Bad');
    expect(getRatingStatus(0)).toBe('Bad');
  });
});
