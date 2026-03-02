/**
 * Unit Tests: src/utils/promise.js
 * Tests: sleep
 */
import { sleep } from '@/utils/promise';

describe('sleep()', () => {
  it('returns a Promise', () => {
    const result = sleep(10);
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves after the specified delay', async () => {
    const start = Date.now();
    await sleep(100);
    const elapsed = Date.now() - start;
    // Allow ±50ms tolerance for timer inaccuracy
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });

  it('uses a default delay of 100ms when called with no argument', async () => {
    const start = Date.now();
    await sleep();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });
});
