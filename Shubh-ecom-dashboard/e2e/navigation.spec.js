// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: App-Level Navigation
 *
 * Tests that do NOT require being logged in:
 * - Root URL behaviour (redirecting unauthenticated users)
 * - Sign-in page accessibility
 * - Direct URL navigation for protected routes
 *
 * The test.describe blocks that require login are gated behind
 * PLAYWRIGHT_ADMIN_EMAIL + PLAYWRIGHT_ADMIN_PASSWORD env vars.
 */

const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD || '';

test.describe('Navigation — Unauthenticated redirects', () => {
  const protectedRoutes = [
    '/dashboard',
    '/products',
    '/orders',
    '/users',
    '/categories',
    '/coupons',
    '/customer',
    '/analytics',
    '/inventory',
    '/invoice',
    '/review',
    '/settings',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects unauthenticated user to sign-in (or 404)`, async ({ page }) => {
      const response = await page.goto(route);
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      const status = response?.status() ?? 0;

      // Accept either:
      // 1. A redirect to the sign-in page (NextAuth middleware protection)
      // 2. A 404 (route doesn't exist in this context, still prevents access)
      // Both outcomes mean an unauthenticated user cannot access protected content.
      const isRedirectedToSignIn = finalUrl.includes('sign-in') || finalUrl.includes('auth');
      const isNotFound = status === 404;
      expect(isRedirectedToSignIn || isNotFound).toBe(true);
    });
  }
});

test.describe('Navigation — Sign-in page is publicly accessible', () => {
  test('GET /auth/sign-in returns 200 and renders the page', async ({ page }) => {
    const response = await page.goto('/auth/sign-in');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { name: /admin login/i })).toBeVisible();
  });
});

// Authenticated navigation tests — run only when real credentials are set
test.describe('Navigation — Authenticated sidebar routes', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Skipped: Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD env vars');

  test.beforeEach(async ({ page }) => {
    // Login before every test in this block
    await page.goto('/auth/sign-in');
    await page.locator('#email-id').fill(ADMIN_EMAIL);
    await page.locator('#password-id').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /login now/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 15_000 });
  });

  test('dashboard page loads and URL contains /dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('navigating to /products shows the products page', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveURL(/products/);
    await page.waitForLoadState('networkidle');
    // Page should not be sign-in
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test('navigating to /orders shows the orders page', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/orders/);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test('navigating to /customer shows the customers page', async ({ page }) => {
    await page.goto('/customer');
    await expect(page).toHaveURL(/customer/);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/sign-in/);
  });
});
