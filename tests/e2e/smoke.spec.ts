import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Public Prep/i);
  });

  test('auth page loads', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('API health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Authentication Flow', () => {
  const testEmail = `e2e-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test('can register new user', async ({ page }) => {
    await page.goto('/auth');

    // Wait for form to load
    await page.waitForSelector('text=Create an account');

    // Fill registration form using labels
    await page.getByLabel('First Name').fill('E2E');
    await page.getByLabel('Last Name').fill('Test');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);

    // Submit
    await page.getByRole('button', { name: /create your account/i }).click();

    // Should redirect to app or show success
    await expect(page).toHaveURL(/\/(app|dashboard)?/, { timeout: 10000 });
  });
});
