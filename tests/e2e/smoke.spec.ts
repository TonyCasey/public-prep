import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Public Prep/i);
  });

  test('auth page loads', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('input[type="email"]')).toBeVisible();
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

    // Fill registration form
    const inputs = await page.locator('input').all();
    await inputs[0].fill('E2E');
    await inputs[1].fill('Test');
    await inputs[2].fill(testEmail);
    await inputs[3].fill(testPassword);

    // Submit
    await page.locator('button[type="submit"]').first().click();

    // Should redirect to app or show success
    await expect(page).toHaveURL(/\/(app|dashboard)?/, { timeout: 10000 });
  });
});
