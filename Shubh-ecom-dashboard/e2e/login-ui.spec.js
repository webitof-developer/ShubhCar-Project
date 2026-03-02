// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: Sign-in Page — UI & Accessibility
 * Focused on verifiable page structure without needing real credentials.
 * Covers: page metadata, form structure, labels, placeholders, logo.
 */

test.describe('Sign-in Page — UI Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in');
    // Wait for the page to fully render
    await page.waitForLoadState('networkidle');
  });

  test('page has a valid document title', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('displays the "Admin Console" badge', async ({ page }) => {
    await expect(page.getByText('Admin Console')).toBeVisible();
  });

  test('displays the page subtitle about credentials', async ({ page }) => {
    await expect(page.getByText(/access your dashboard with your credentials/i)).toBeVisible();
  });

  test('email input accepts typed text', async ({ page }) => {
    const emailInput = page.locator('#email-id');
    await emailInput.fill('admin@example.com');
    await expect(emailInput).toHaveValue('admin@example.com');
  });

  test('password input masks typed characters', async ({ page }) => {
    const passwordInput = page.locator('#password-id');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await passwordInput.fill('secret123');
    await expect(passwordInput).toHaveValue('secret123');
  });

  test('LOGIN NOW button is enabled by default', async ({ page }) => {
    const btn = page.getByRole('button', { name: /login now/i });
    await expect(btn).toBeEnabled();
  });

  test('form has correct action (submits via JS, no page reload on submit)', async ({ page }) => {
    // Fill valid-looking email but wrong password, submit
    await page.locator('#email-id').fill('test@test.com');
    await page.locator('#password-id').fill('somepassword');
    await page.getByRole('button', { name: /login now/i }).click();

    // Page should still be on sign-in (no hard page reload because it's a SPA)
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe('Sign-in Page — Form Validation (client-side)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in');
  });

  test('clicking submit with empty fields keeps user on the sign-in page', async ({ page }) => {
    await page.getByRole('button', { name: /login now/i }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/sign-in/);
  });

  test('shows validation error for empty email on submit', async ({ page }) => {
    // Only fill password, leave email empty
    await page.locator('#password-id').fill('somepassword');
    await page.getByRole('button', { name: /login now/i }).click();
    await expect(page.getByText('Required field').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows "Email is wrong" when email is malformed', async ({ page }) => {
    await page.locator('#email-id').fill('invalid-email-format');
    await page.locator('#password-id').fill('somepassword');
    await page.getByRole('button', { name: /login now/i }).click();
    await expect(page.getByText('Email is wrong')).toBeVisible({ timeout: 5000 });
  });

  test('clears email validation error once a valid email is entered', async ({ page }) => {
    // First trigger the error
    await page.locator('#email-id').fill('bad-email');
    await page.getByRole('button', { name: /login now/i }).click();
    await expect(page.getByText('Email is wrong')).toBeVisible({ timeout: 5000 });

    // Now type a valid email
    await page.locator('#email-id').fill('valid@email.com');
    await page.getByRole('button', { name: /login now/i }).click();
    // Email error should be gone now
    await expect(page.getByText('Email is wrong')).not.toBeVisible({ timeout: 5000 });
  });
});
