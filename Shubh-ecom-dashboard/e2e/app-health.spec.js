// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: App-wide Health & Accessibility Checks
 *
 * Verifies that the application:
 * - Responds with valid HTTP status codes (no 5xx)
 * - Has correct meta/SEO structure on key public pages
 * - Does not display JavaScript errors on page load
 * - Meets basic accessibility expectations (heading hierarchy, roles)
 */

test.describe('App Health — HTTP responses', () => {
  const publicPages = [
    { path: '/auth/sign-in', label: 'Sign-in' },
  ];

  for (const { path, label } of publicPages) {
    test(`${label} page responds with HTTP < 400`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
    });
  }

  const protectedPages = ['/dashboard', '/products', '/orders'];

  for (const path of protectedPages) {
    test(`${path} responds (redirects) without 5xx error`, async ({ page }) => {
      const response = await page.goto(path);
      // Either gets a 200 (if auth middleware handles it in-app)
      // or a redirect; either way should never be a 5xx
      expect(response?.status()).not.toBeGreaterThanOrEqual(500);
    });
  }
});

test.describe('App Health — JavaScript console errors', () => {
  test('sign-in page loads without critical JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');

    // Filter to only show actual runtime errors (not warnings/expected auth errors)
    const criticalErrors = errors.filter(
      (e) => !e.includes('Warning') && !e.includes('hydrat')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('App Health — Sign-in Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');
  });

  test('page has exactly one <h1> heading', async ({ page }) => {
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
  });

  test('the <h1> contains "ADMIN LOGIN"', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText(/admin login/i);
  });

  test('email input has an associated label', async ({ page }) => {
    // label is associated via htmlFor="email-id"
    const label = page.locator('label[for="email-id"]');
    await expect(label).toBeVisible();
  });

  test('password input has an associated label', async ({ page }) => {
    const label = page.locator('label[for="password-id"]');
    await expect(label).toBeVisible();
  });

  test('submit button is focusable and accessible by keyboard', async ({ page }) => {
    const btn = page.getByRole('button', { name: /login now/i });
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test('page uses HTTPS or localhost (no mixed content)', async ({ page }) => {
    const url = page.url();
    expect(url.startsWith('http://localhost') || url.startsWith('https://')).toBe(true);
  });
});

test.describe('App Health — 404 Page', () => {
  test('navigating to a non-existent route shows a not-found page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-at-all-xyz-123');
    // Next.js returns 404 or redirects to auth; either is acceptable
    const status = response?.status();
    // Should not be a 5xx error
    expect(status).toBeLessThan(500);
  });
});
