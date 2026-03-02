/**
 * Unit Tests: src/utils/change-casing.js
 * Tests: snakeToTitleCase, kebabToTitleCase, toSentenceCase, toAlphaNumber
 */
import {
  snakeToTitleCase,
  kebabToTitleCase,
  toSentenceCase,
  toAlphaNumber,
} from '@/utils/change-casing';

describe('snakeToTitleCase()', () => {
  it('converts a simple snake_case string to Title Case', () => {
    expect(snakeToTitleCase('hello_world')).toBe('Hello World');
  });

  it('converts multi-word snake_case string', () => {
    expect(snakeToTitleCase('order_status_update')).toBe('Order Status Update');
  });

  it('handles a single word (no underscore)', () => {
    expect(snakeToTitleCase('dashboard')).toBe('Dashboard');
  });

  it('filters out empty segments from double underscores', () => {
    expect(snakeToTitleCase('hello__world')).toBe('Hello World');
  });
});

describe('kebabToTitleCase()', () => {
  it('converts a simple kebab-case string to Title Case', () => {
    expect(kebabToTitleCase('hello-world')).toBe('Hello World');
  });

  it('converts multi-word kebab-case string', () => {
    expect(kebabToTitleCase('product-category-name')).toBe('Product Category Name');
  });

  it('handles a single word (no dash)', () => {
    expect(kebabToTitleCase('invoice')).toBe('Invoice');
  });

  it('filters out empty segments from double dashes', () => {
    expect(kebabToTitleCase('hello--world')).toBe('Hello World');
  });
});

describe('toSentenceCase()', () => {
  it('capitalises the first character of a lowercase string', () => {
    expect(toSentenceCase('hello world')).toBe('Hello world');
  });

  it('leaves already-capitalised strings unchanged', () => {
    expect(toSentenceCase('Hello')).toBe('Hello');
  });

  it('handles a single character', () => {
    expect(toSentenceCase('a')).toBe('A');
  });

  it('handles empty string without throwing', () => {
    expect(toSentenceCase('')).toBe('');
  });
});

describe('toAlphaNumber()', () => {
  it('returns plain number for values under 1,000', () => {
    expect(toAlphaNumber(999)).toBe(999);
    expect(toAlphaNumber(0)).toBe(0);
  });

  it('converts thousands to K notation', () => {
    expect(toAlphaNumber(1000)).toBe('1K');
    expect(toAlphaNumber(1500)).toBe('1.5K');
    expect(toAlphaNumber(999999)).toBe('1000K'); // edge: just under 1M
  });

  it('converts millions to M notation', () => {
    expect(toAlphaNumber(1_000_000)).toBe('1M');
    expect(toAlphaNumber(2_500_000)).toBe('2.5M');
  });

  it('converts billions to B notation', () => {
    expect(toAlphaNumber(1_000_000_000)).toBe('1B');
  });

  it('converts trillions to T notation', () => {
    expect(toAlphaNumber(1_000_000_000_000)).toBe('1T');
  });
});
