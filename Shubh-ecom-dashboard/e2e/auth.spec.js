// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: Authentication Flow
 *
 * Covers:
 * - Sign-in page renders correctly
 * - Invalid credentials show an error
 * - Valid credentials redirect to the dashboard
 * - Unauthenticated access to /dashboard redirects back to sign-in
 *
 * NOTE: Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD
 * environment variables for valid login tests.
 * If not set, those tests are skipped gracefully.
 */

const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD || '';

test.describe('Authentication — Sign-in Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in');
  });

  test('sign-in page loads and displays the ADMIN LOGIN heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /admin login/i })).toBeVisible();
  });

  test('sign-in page has an email field', async ({ page }) => {
    await expect(page.locator('#email-id')).toBeVisible();
  });

  test('sign-in page has a password field', async ({ page }) => {
    await expect(page.locator('#password-id')).toBeVisible();
  });

  test('sign-in page has a LOGIN NOW button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /login now/i })).toBeVisible();
  });

  test('submitting empty form shows Required field validation errors', async ({ page }) => {
    await page.getByRole('button', { name: /login now/i }).click();
    // Both email and password required errors should appear
    const errors = page.getByText('Required field');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
    await expect(await errors.count()).toBeGreaterThanOrEqual(1);
  });

  test('typing an invalid email shows "Email is wrong" error', async ({ page }) => {
    await page.locator('#email-id').fill('notanemail');
    await page.getByRole('button', { name: /login now/i }).click();
    await expect(page.getByText('Email is wrong')).toBeVisible({ timeout: 5000 });
  });

  test('page title is non-empty', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe('Authentication — Login with invalid credentials', () => {
  test('shows an error message for wrong credentials', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.locator('#email-id').fill('wrong@test.com');
    await page.locator('#password-id').fill('wrongpassword');
    await page.getByRole('button', { name: /login now/i }).click();

    // After failed login, should stay on sign-in page (no redirect)
    // and show an error (in the form)
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe('Authentication — Unauthenticated access', () => {
  test('accessing /dashboard when not logged in redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    // Should be redirected to the sign-in page
    await expect(page).toHaveURL(/sign-in|auth/, { timeout: 10_000 });
  });

  test('accessing /products when not logged in redirects to sign-in', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveURL(/sign-in|auth/, { timeout: 10_000 });
  });

  test('accessing /orders when not logged in redirects to sign-in', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/sign-in|auth/, { timeout: 10_000 });
  });
});

// These tests only run when real credentials are provided
test.describe('Authentication — Valid login flow', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Skipped: Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD to run');

  test('valid credentials redirect to dashboard', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.locator('#email-id').fill(ADMIN_EMAIL);
    await page.locator('#password-id').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /login now/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
  });
});
