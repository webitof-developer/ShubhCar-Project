/**
 * Unit Tests: src/utils/date.js
 * Tests: addOrSubtractDaysFromDate, addOrSubtractMinutesFromDate, timeSince
 */
import {
  addOrSubtractDaysFromDate,
  addOrSubtractMinutesFromDate,
  timeSince,
} from '@/utils/date';

describe('addOrSubtractDaysFromDate()', () => {
  it('adds the correct number of days', () => {
    const today = new Date();
    const result = addOrSubtractDaysFromDate(5, true, today);
    // The result should be approximately 5 days ahead of today (within 1-day buffer)
    const diffMs = result.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(5);
  });

  it('subtracts the correct number of days', () => {
    const today = new Date();
    const result = addOrSubtractDaysFromDate(5, false, today);
    const diffMs = today.getTime() - result.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(5);
  });

  it('returns a Date object', () => {
    const result = addOrSubtractDaysFromDate(1, true);
    expect(result).toBeInstanceOf(Date);
  });
});


describe('addOrSubtractMinutesFromDate()', () => {
  it('adds the correct number of minutes to date', () => {
    const start = new Date('2024-01-10T10:00:00');
    const result = addOrSubtractMinutesFromDate(30, true, start);
    expect(result.getMinutes()).toBe(30);
  });

  it('subtracts the correct number of minutes from date', () => {
    const start = new Date('2024-01-10T10:30:00');
    const result = addOrSubtractMinutesFromDate(30, false, start);
    expect(result.getMinutes()).toBe(0);
  });

  it('returns a Date object', () => {
    const result = addOrSubtractMinutesFromDate(10, true);
    expect(result).toBeInstanceOf(Date);
  });
});

describe('timeSince()', () => {
  it('returns a string ending with "ago"', () => {
    const past = new Date(Date.now() - 60 * 1000); // 1 minute ago
    expect(timeSince(past)).toMatch(/ago$/);
  });

  it('correctly handles a date that is about 1 second ago', () => {
    const past = new Date(Date.now() - 1500); // 1.5s ago
    const result = timeSince(past);
    expect(result).toBe('1 second ago');
  });

  it('correctly handles a date passed as a string', () => {
    const past = new Date(Date.now() - 60 * 1000).toISOString();
    const result = timeSince(past);
    expect(result).toMatch(/minute/);
  });

  it('handles 2 minutes resulting in plural "minutes"', () => {
    const past = new Date(Date.now() - 2 * 60 * 1000);
    const result = timeSince(past);
    expect(result).toBe('2 minutes ago');
  });
});
