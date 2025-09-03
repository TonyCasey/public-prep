import { test, expect } from '@playwright/test';

test.describe('Component Interaction Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authenticated user for component tests
    await page.goto('/');
    await page.click('button:has-text("Get Started Now")');
    
    const timestamp = Date.now();
    await page.fill('input[type="email"]', `component-test${timestamp}@example.com`);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Create Account")');
    
    await page.waitForURL('/app');
  });

  test('should handle CV upload and analysis flow', async ({ page }) => {
    // 1. Upload CV
    await page.click('button:has-text("Upload CV")');
    
    const cvContent = `
Jane Smith
Senior Administrative Officer
Department of Health

Experience:
- 8 years in public service
- Led team of 12 staff members
- Managed €2M budget
- Implemented new digital processes
- Stakeholder engagement across multiple departments

Education:
- Master's in Public Administration
- Certified Project Manager (PMP)
    `;
    
    await page.setInputFiles('input[type="file"]', {
      name: 'jane-smith-cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(cvContent)
    });

    // 2. Wait for processing
    await expect(page.locator('text=Processing')).toBeVisible();
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible({ timeout: 30000 });

    // 3. Verify analysis results
    await expect(page.locator('text=Team Leadership')).toBeVisible();
    await expect(page.locator('text=Management & Delivery')).toBeVisible();
    
    // 4. Check progress indicators
    const progressBars = page.locator('[role="progressbar"]');
    expect(await progressBars.count()).toBeGreaterThan(0);
  });

  test('should handle interview session creation', async ({ page }) => {
    // Upload CV first
    await page.click('button:has-text("Upload CV")');
    await page.setInputFiles('input[type="file"]', {
      name: 'test-cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test CV content with relevant experience')
    });
    
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible({ timeout: 30000 });

    // Start new interview
    await page.click('button:has-text("Start AI Analysis")');
    
    // Select interview options
    await page.waitForSelector('[data-testid="new-interview-modal"]');
    
    // Select grade
    await page.click('select[name="grade"]');
    await page.selectOption('select[name="grade"]', 'heo');
    
    // Select framework
    await page.click('input[value="old"]');
    
    await page.click('button:has-text("Start Interview")');
    
    // Should navigate to interview page
    await page.waitForURL(/\/app\/interview/);
    await expect(page.locator('text=Question 1 of 12')).toBeVisible();
  });

  test('should handle speech recognition', async ({ page }) => {
    // Start interview first
    await page.click('button:has-text("Upload CV")');
    await page.setInputFiles('input[type="file"]', {
      name: 'test-cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test CV content')
    });
    
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible({ timeout: 30000 });
    await page.click('button:has-text("Start AI Analysis")');
    await page.click('button:has-text("Start Interview")');
    
    await page.waitForURL(/\/app\/interview/);
    
    // Test microphone button
    const micButton = page.locator('button[aria-label*="microphone"]');
    if (await micButton.isVisible()) {
      await micButton.click();
      
      // Should show recording state
      await expect(page.locator('text=Recording')).toBeVisible();
      
      // Stop recording
      await micButton.click();
    }
  });

  test('should handle answer submission and evaluation', async ({ page }) => {
    // Setup interview
    await page.click('button:has-text("Upload CV")');
    await page.setInputFiles('input[type="file"]', {
      name: 'test-cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test CV content with leadership experience')
    });
    
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible({ timeout: 30000 });
    await page.click('button:has-text("Start AI Analysis")');
    await page.click('button:has-text("Start Interview")');
    
    await page.waitForURL(/\/app\/interview/);
    
    // Answer question
    const answer = `
Situation: As a team leader in my previous role, I was tasked with implementing a new digital system across our department.

Task: I needed to ensure all 15 team members were trained and the system was operational within 3 months while maintaining current service levels.

Action: I developed a phased training approach, created user guides, established a buddy system for support, and held weekly progress meetings. I also communicated regularly with stakeholders about our progress.

Result: We successfully implemented the system 2 weeks ahead of schedule with 98% user adoption rate and improved our processing time by 30%.
    `;
    
    await page.fill('textarea[placeholder*="your answer"]', answer);
    await page.click('button:has-text("Submit Answer")');
    
    // Should show evaluation or payment modal
    const hasEvaluation = await page.locator('text=AI Feedback').isVisible({ timeout: 5000 });
    const hasPayment = await page.locator('text=Free evaluation limit reached').isVisible({ timeout: 5000 });
    
    expect(hasEvaluation || hasPayment).toBeTruthy();
    
    if (hasEvaluation) {
      // Check evaluation components
      await expect(page.locator('text=Overall Score')).toBeVisible();
      await expect(page.locator('text=STAR Method')).toBeVisible();
    }
  });

  test('should handle progress tracking', async ({ page }) => {
    // Navigate to analytics/progress
    await page.click('button:has-text("Analytics")');
    
    // Should show progress overview
    await expect(page.locator('text=Your Progress Overview')).toBeVisible();
    
    // Check for competency charts
    const charts = page.locator('canvas, svg[role="img"]');
    expect(await charts.count()).toBeGreaterThan(0);
  });

  test('should handle export functionality', async ({ page }) => {
    // Create interview session first
    await page.click('button:has-text("Upload CV")');
    await page.setInputFiles('input[type="file"]', {
      name: 'test-cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test CV content')
    });
    
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible({ timeout: 30000 });
    
    // Check if there are completed interviews to export
    const interviewCards = page.locator('[data-testid="interview-card"]');
    const interviewCount = await interviewCards.count();
    
    if (interviewCount > 0) {
      // Click on first interview
      await interviewCards.first().click();
      
      // Look for export button
      const exportButton = page.locator('button:has-text("Export")');
      if (await exportButton.isVisible()) {
        // Set up download handler
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/interview-report.*\.json/);
      }
    }
  });
});