/**
 * E2E Helper: Shared authentication utility
 * Provides a reusable login function for Playwright E2E tests.
 * 
 * Usage:
 *   import { loginAs } from '../helpers/auth';
 *   await loginAs(page, 'admin@shubhcars.com', 'yourpassword');
 */

/**
 * Performs the login flow and waits for the dashboard to load.
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
async function loginAs(page, email, password) {
  await page.goto('/auth/sign-in');

  // Fill the email field (floating label — identified by id)
  await page.locator('#email-id').fill(email);

  // Fill the password field
  await page.locator('#password-id').fill(password);

  // Click the submit button
  await page.getByRole('button', { name: /login now/i }).click();

  // Wait for navigation away from the sign-in page
  await page.waitForURL((url) => !url.pathname.includes('sign-in'), {
    timeout: 15_000,
  });
}

/**
 * Checks if the page is currently on the login screen.
 * @param {import('@playwright/test').Page} page
 */
async function isOnLoginPage(page) {
  return page.url().includes('sign-in');
}

module.exports = { loginAs, isOnLoginPage };
