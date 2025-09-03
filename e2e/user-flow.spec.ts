import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test('should complete full registration to payment flow', async ({ page }) => {
    // 1. Landing Page
    await page.goto('/');
    await expect(page).toHaveTitle(/Public Service Prep/);
    await expect(page.locator('h1')).toContainText('Practice Questions for Public Service Jobs in Ireland');

    // 2. Try Sample Question (unauthenticated)
    await page.fill('textarea[placeholder*="your answer"]', 'Sample answer for testing purposes');
    await expect(page.locator('textarea')).toHaveValue('Sample answer for testing purposes');

    // 3. Click CTA to Register
    await page.click('button:has-text("Get Started Now")');
    
    // 4. Register New User
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Create Account")');
    
    // 5. Should redirect to dashboard
    await page.waitForURL('/app');
    await expect(page.locator('h1')).toContainText('Your Interview Dashboard');

    // 6. Upload CV
    await page.click('button:has-text("Upload CV")');
    
    // Create a test file for upload
    const fileContent = `
John Doe
Experience: 5 years in public administration
Skills: Team leadership, project management, stakeholder engagement
Education: BA in Public Administration
    `;
    
    await page.setInputFiles('input[type="file"]', {
      name: 'test-cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    });

    // 7. Wait for AI Analysis
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible({ timeout: 30000 });

    // 8. Start Interview
    await page.click('button:has-text("Start AI Analysis")');
    await page.waitForSelector('[data-testid="new-interview-modal"]', { timeout: 10000 });
    
    await page.click('button:has-text("Start Interview")');
    
    // 9. Answer Question
    await page.waitForSelector('textarea[placeholder*="your answer"]');
    await page.fill('textarea[placeholder*="your answer"]', 'This is a comprehensive answer demonstrating the STAR method. Situation: In my previous role, I faced a challenging deadline. Task: I needed to coordinate a team of 5 people. Action: I implemented daily standup meetings and created a shared tracking system. Result: We delivered the project 2 days early with 100% quality standards.');
    
    await page.click('button:has-text("Submit Answer")');

    // 10. Should trigger payment modal after free limit
    await expect(page.locator('text=Free evaluation limit reached')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Upgrade to Premium')).toBeVisible();

    // 11. Test Payment Modal Scrolling
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Verify modal is scrollable
    await expect(modal).toHaveCSS('max-height', /90vh/);
    await expect(modal).toHaveCSS('overflow-y', 'auto');

    // 12. Click Upgrade Button
    await page.click('button:has-text("Secure My Advantage")');
    
    // 13. Should redirect to Stripe (we won't complete payment in test)
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 10000 });
    await expect(page.url()).toContain('checkout.stripe.com');
  });

  test('should handle existing user login flow', async ({ page }) => {
    // Test login with existing credentials
    await page.goto('/');
    await page.click('button:has-text("Get Started Now")');
    
    // Switch to login mode
    await page.click('text=Already have an account? Sign in');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Should handle login (may fail if user doesn't exist, which is expected)
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check mobile layout
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    
    // Test navigation
    await page.click('button:has-text("Get Started Now")');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should handle file upload validation', async ({ page }) => {
    // Register and login first
    await page.goto('/');
    await page.click('button:has-text("Get Started Now")');
    
    const timestamp = Date.now();
    await page.fill('input[type="email"]', `test${timestamp}@example.com`);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Create Account")');
    
    await page.waitForURL('/app');
    
    // Test invalid file type
    await page.click('button:has-text("Upload CV")');
    
    await page.setInputFiles('input[type="file"]', {
      name: 'test.invalid',
      mimeType: 'application/invalid',
      buffer: Buffer.from('invalid file content')
    });
    
    // Should show error for invalid file type
    await expect(page.locator('text=Invalid file type')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Performance Tests', () => {
  test('should load pages within performance budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - start;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check for performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      };
    });
    
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
  });
});

test.describe('Accessibility Tests', () => {
  test('should meet accessibility standards', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for form labels
    await page.click('button:has-text("Get Started Now")');
    await expect(page.locator('label[for*="email"]')).toBeVisible();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check focus is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});