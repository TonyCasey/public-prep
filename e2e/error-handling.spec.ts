import { test, expect } from '@playwright/test';

test.describe('Error Handling and Edge Cases', () => {
  test('should handle network failures gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.click('button:has-text("Get Started Now")');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Create Account")');
    
    // Should show network error
    await expect(page.locator('text=Network error')).toBeVisible({ timeout: 10000 });
    
    // Restore connection
    await page.context().setOffline(false);
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Get Started Now")');
    
    // Switch to login
    await page.click('text=Already have an account? Sign in');
    
    await page.fill('input[type="email"]', 'nonexistent@publicserviceprep.ie');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
  });

  test('should handle file upload errors', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('button:has-text("Get Started Now")');
    
    const timestamp = Date.now();
    await page.fill('input[type="email"]', `error-test${timestamp}@example.com`);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Create Account")');
    
    await page.waitForURL('/app');
    
    // Test oversized file
    const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB file
    
    await page.click('button:has-text("Upload CV")');
    await page.setInputFiles('input[type="file"]', {
      name: 'large-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(largeContent)
    });
    
    // Should show file size error
    await expect(page.locator('text=File too large')).toBeVisible({ timeout: 5000 });
  });

  test('should handle missing required fields', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Get Started Now")');
    
    // Try to submit without email
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Create Account")');
    
    // Should show validation error
    await expect(page.locator('text=Email is required')).toBeVisible();
    
    // Try to submit without password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '');
    await page.click('button:has-text("Create Account")');
    
    // Should show password validation error
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should handle session expiration', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('button:has-text("Get Started Now")');
    
    const timestamp = Date.now();
    await page.fill('input[type="email"]', `session-test${timestamp}@example.com`);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Create Account")');
    
    await page.waitForURL('/app');
    
    // Clear session storage to simulate expiration
    await page.evaluate(() => {
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    });
    
    // Try to access protected content
    await page.reload();
    
    // Should redirect to login
    await expect(page.url()).toMatch(/\/$/);
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    
    // Navigate through the app
    await page.click('button:has-text("Get Started Now")');
    await expect(page.url()).toMatch(/\/#auth/);
    
    // Go back
    await page.goBack();
    await expect(page.url()).toBe('http://localhost:5000/');
    
    // Go forward
    await page.goForward();
    await expect(page.url()).toMatch(/\/#auth/);
  });

  test('should handle concurrent user sessions', async ({ browser }) => {
    // Create two browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    const timestamp = Date.now();
    
    // Register same user in both contexts
    await page1.goto('/');
    await page1.click('button:has-text("Get Started Now")');
    await page1.fill('input[type="email"]', `concurrent${timestamp}@example.com`);
    await page1.fill('input[type="password"]', 'TestPassword123!');
    await page1.click('button:has-text("Create Account")');
    
    await page2.goto('/');
    await page2.click('button:has-text("Get Started Now")');
    await page2.click('text=Already have an account? Sign in');
    await page2.fill('input[type="email"]', `concurrent${timestamp}@example.com`);
    await page2.fill('input[type="password"]', 'TestPassword123!');
    await page2.click('button:has-text("Sign In")');
    
    // Both should work independently
    await expect(page1.locator('h1:has-text("Dashboard")')).toBeVisible();
    await expect(page2.locator('h1:has-text("Dashboard")')).toBeVisible();
    
    await context1.close();
    await context2.close();
  });
});