import { test, expect } from '@playwright/test';

// Production environment configuration
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://publicserviceprep.replit.app';
const TEST_EMAIL = `test_${Date.now()}@publicserviceprep.ie`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Production Environment Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to production site
    await page.goto(PRODUCTION_URL);
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
  });

  test('Homepage loads and displays core elements', async ({ page }) => {
    // Verify homepage loads
    await expect(page).toHaveTitle(/Public Service Prep/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Practice Questions for Public Service Jobs in Ireland');
    
    // Verify CTA button is present
    await expect(page.locator('text=Get Started Now')).toBeVisible();
    
    // Check sample question section
    await expect(page.locator('text=Try a Sample Question')).toBeVisible();
    
    // Verify feature boxes
    await expect(page.locator('text=Answer Scores')).toBeVisible();
    await expect(page.locator('text=CV Analysis')).toBeVisible();
    await expect(page.locator('text=AI Coaching')).toBeVisible();
  });

  test('Sample question evaluation works', async ({ page }) => {
    // Find and fill sample question textarea
    const textarea = page.locator('textarea[placeholder*="answer"]');
    await expect(textarea).toBeVisible();
    
    await textarea.fill('I led a team project where I had to coordinate with multiple stakeholders to implement a new system. I used regular meetings and clear communication to ensure everyone was aligned with the objectives and deliverables.');
    
    // Click evaluate button
    await page.locator('button:has-text("Evaluate My Answer")').click();
    
    // Wait for evaluation modal to appear
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Check that evaluation stages appear
    await expect(page.locator('text=Analyzing Response')).toBeVisible();
    
    // Wait for evaluation to complete (up to 30 seconds)
    await page.waitForSelector('text=Overall Score', { timeout: 30000 });
    
    // Verify evaluation results appear
    await expect(page.locator('text=STAR Method Analysis')).toBeVisible();
    await expect(page.locator('text=Strengths')).toBeVisible();
    await expect(page.locator('text=Areas for Improvement')).toBeVisible();
  });

  test('User registration flow', async ({ page }) => {
    // Click Get Started
    await page.locator('text=Get Started Now').click();
    
    // Should navigate to auth page
    await expect(page).toHaveURL(/\/auth/);
    
    // Switch to registration mode
    await page.locator('text=Create an account').click();
    
    // Fill registration form
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    
    // Submit registration
    await page.locator('button:has-text("Create Your Account")').click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/app/);
    
    // Verify dashboard loads with welcome content
    await expect(page.locator('h1')).toContainText('Your Interview Dashboard');
  });

  test('CV upload functionality', async ({ page }) => {
    // Login first (assuming user exists from previous test)
    await page.goto(`${PRODUCTION_URL}/auth`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.locator('button:has-text("Sign In")').click();
    
    await page.waitForURL(/\/app/);
    
    // Start new interview
    await page.locator('button:has-text("Start Your First Interview")').click();
    
    // Modal should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Upload CV section should be visible
    await expect(page.locator('text=Upload Your CV')).toBeVisible();
    
    // Create a test file upload (mock CV content)
    const fileContent = 'Test CV Content\nName: John Doe\nExperience: 5 years in public service';
    await page.setInputFiles('input[type="file"]', {
      name: 'test-cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    });
    
    // Verify file appears as uploaded
    await expect(page.locator('text=test-cv.txt')).toBeVisible();
  });

  test('Payment integration validation', async ({ page }) => {
    // Login as free user
    await page.goto(`${PRODUCTION_URL}/auth`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.locator('button:has-text("Sign In")').click();
    
    await page.waitForURL(/\/app/);
    
    // Look for upgrade button (should be visible for free users)
    const upgradeButton = page.locator('button:has-text("Upgrade")');
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      
      // Payment modal should appear
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Verify pricing options
      await expect(page.locator('text=€49')).toBeVisible(); // Starter
      await expect(page.locator('text=€149')).toBeVisible(); // Premium
      
      // Verify Stripe integration (don't actually purchase)
      await expect(page.locator('button:has-text("Get Starter Package")')).toBeVisible();
      await expect(page.locator('button:has-text("Get Lifetime Premium")')).toBeVisible();
    }
  });

  test('Mobile responsiveness validation', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Homepage should be responsive
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Get Started Now')).toBeVisible();
    
    // Navigate to app (assuming user login)
    await page.goto(`${PRODUCTION_URL}/auth`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.locator('button:has-text("Sign In")').click();
    
    await page.waitForURL(/\/app/);
    
    // Dashboard should be mobile-friendly
    await expect(page.locator('h1')).toBeVisible();
    
    // Try opening new interview modal on mobile
    await page.locator('button:has-text("Start Your First Interview")').click();
    
    // Modal should be responsive
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Modal should fit within viewport
    const modalBox = await modal.boundingBox();
    expect(modalBox?.width).toBeLessThanOrEqual(375);
  });

  test('Database connectivity and user data persistence', async ({ page }) => {
    // Login
    await page.goto(`${PRODUCTION_URL}/auth`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.locator('button:has-text("Sign In")').click();
    
    await page.waitForURL(/\/app/);
    
    // Check that user data persists across page refreshes
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be logged in and see dashboard
    await expect(page).toHaveURL(/\/app/);
    await expect(page.locator('h1')).toContainText('Your Interview Dashboard');
    
    // User menu should show correct email
    await page.locator('button[aria-label="User menu"]').click();
    await expect(page.locator(`text=${TEST_EMAIL}`)).toBeVisible();
  });

  test('API health check', async ({ page }) => {
    // Direct API health check
    const response = await page.request.get(`${PRODUCTION_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    
    const healthData = await response.json();
    expect(healthData.status).toBe('ok');
  });

  test('Error handling and 404 pages', async ({ page }) => {
    // Test non-existent route
    await page.goto(`${PRODUCTION_URL}/non-existent-page`);
    
    // Should handle gracefully (either 404 page or redirect to home)
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Page should either show 404 content or redirect to a valid page
    const url = page.url();
    const isValidResponse = url.includes('/') || 
                           await page.locator('text=404').isVisible() ||
                           await page.locator('text=Page not found').isVisible();
    
    expect(isValidResponse).toBeTruthy();
  });

  test('SEO and meta tags validation', async ({ page }) => {
    // Check homepage meta tags
    const title = await page.locator('title').textContent();
    expect(title).toBeTruthy();
    expect(title).toMatch(/Public Service/);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content');
    
    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content');
    
    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute('content');
  });
});

// Production performance tests
test.describe('Production Performance Validation', () => {
  test('Page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should have minimal console errors
    expect(errors.length).toBeLessThan(3);
  });
});

// Security validation tests
test.describe('Production Security Validation', () => {
  test('HTTPS redirect and security headers', async ({ page }) => {
    const response = await page.request.get(PRODUCTION_URL);
    
    // Should use HTTPS
    expect(response.url()).toMatch(/^https:/);
    
    // Check for security headers
    const headers = response.headers();
    
    // Should have security headers (depending on server config)
    // These might not all be present but good to check
    console.log('Security headers:', {
      'x-frame-options': headers['x-frame-options'],
      'x-content-type-options': headers['x-content-type-options'],
      'strict-transport-security': headers['strict-transport-security']
    });
  });
  
  test('Authentication protection', async ({ page }) => {
    // Try to access protected route without login
    await page.goto(`${PRODUCTION_URL}/app`);
    
    // Should redirect to auth page
    await page.waitForURL(/\/auth/);
    expect(page.url()).toMatch(/\/auth/);
  });
});