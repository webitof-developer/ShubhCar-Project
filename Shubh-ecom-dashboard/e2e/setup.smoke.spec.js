// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * SMOKE TEST - Phase 1 Playwright Verification
 * This verifies Playwright is correctly configured and can reach the running app.
 */
test.describe('Playwright Setup - Smoke Test', () => {
  test('application home page loads successfully', async ({ page }) => {
    // Navigate to the app root — Next.js will redirect to login if unauthenticated
    const response = await page.goto('/');

    // The page should respond with a 200 (or a redirect that ultimately resolves)
    expect(response?.status()).toBeLessThan(500);
  });

  test('page has a valid <title> element', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    // Title should be a non-empty string
    expect(typeof title).toBe('string');
    expect(title.length).toBeGreaterThan(0);
  });
});
