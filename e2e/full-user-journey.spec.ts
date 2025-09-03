import { test, expect } from '@playwright/test';

test.describe('Complete User Journey - Sample Question to Lifetime Package', () => {
  test('Full 25-step user journey: sample question → register → starter package → lifetime upgrade', async ({ page, context }) => {
    // Step 1: Clear all cookies and sessions
    await context.clearCookies();
    await page.goto('/');
    
    // Step 2: Non registered user on home screen
    await expect(page.getByText('Public Service Prep')).toBeVisible({ timeout: 10000 });
    
    // Step 3: Answer sample question
    await expect(page.getByText('Try A Sample Question')).toBeVisible();
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    
    const sampleAnswer = `I led a team of 5 engineers to implement a new customer portal system. The situation was that our existing portal was outdated and causing customer complaints. My task was to deliver a modern, user-friendly portal within 3 months. I organized daily standups, assigned specific modules to team members, and implemented agile methodology. As a result, we delivered the project 2 weeks early, customer satisfaction increased by 40%, and the new system reduced support tickets by 60%.`;
    
    await textarea.fill(sampleAnswer);
    await page.getByRole('button', { name: 'Get AI Scoring & Feedback' }).click();
    
    // Wait for AI Analysis modal to appear
    await expect(page.getByText('AI Answer Evaluation')).toBeVisible({ timeout: 30000 });
    const modal = page.locator('.fixed.inset-0.bg-black\\/80');
    await expect(modal).toBeVisible({ timeout: 30000 });
    
    // Wait for analysis content to load
    await expect(modal.getByText('Strengths')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(5000);
    
    // Step 4: Close the AI evaluation modal and proceed to registration
    // Try various ways to close the modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // If modal is still open, try clicking outside it
    if (await modal.isVisible()) {
      await page.locator('body').click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(1000);
    }
    
    // Navigate to register page via the main Get Started button
    await page.getByRole('button', { name: 'Get Started' }).first().click();
    
    // Step 5: Register user
    await page.getByText('Need an account? Sign up here').click();
    
    const timestamp = Date.now();
    const testEmail = `tcasey+${timestamp}@buncar.ie`;
    const testPassword = 'testuser';
    
    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    await page.getByRole('button', { name: 'Create Your Account' }).click();
    
    // Wait for registration to complete and redirect to dashboard
    await expect(page.getByText('Your Interviews')).toBeVisible({ timeout: 15000 });
    
    // Step 6: Start an interview
    await page.getByRole('button', { name: /New Interview/i }).click();
    
    // Fill interview setup modal
    await page.selectOption('select[name="grade"]', 'HEO');
    await page.selectOption('select[name="framework"]', '6-competency');
    await page.fill('input[name="jobTitle"]', 'Higher Executive Officer');
    
    await page.getByRole('button', { name: 'Start Interview' }).click();
    
    // Wait for interview page to load
    await expect(page.getByText('Question 1 of 12')).toBeVisible({ timeout: 15000 });
    
    // Step 7: Answer first question
    const firstQuestionTextarea = page.locator('textarea').first();
    await expect(firstQuestionTextarea).toBeVisible();
    
    const firstAnswer = `In my previous role as a senior administrator, I faced a situation where our department's filing system was completely disorganized, causing delays in processing applications. My task was to redesign the entire filing system within 6 weeks to improve efficiency. I conducted a thorough analysis of current processes, consulted with all team members for input, created a new digital filing system with clear categorization, and trained all staff on the new procedures. As a result, application processing time was reduced by 50%, customer satisfaction improved significantly, and our department received commendation from senior management.`;
    
    await firstQuestionTextarea.fill(firstAnswer);
    await page.getByRole('button', { name: 'Submit Answer' }).click();
    
    // Wait for AI evaluation
    await expect(page.getByText('AI Answer Evaluation')).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Next Question' }).click();
    
    // Step 8: Answer second question
    await expect(page.getByText('Question 2 of 12')).toBeVisible();
    const secondQuestionTextarea = page.locator('textarea').first();
    await expect(secondQuestionTextarea).toBeVisible();
    
    const secondAnswer = `I was appointed as project manager for implementing a new customer service protocol across three regional offices. The situation required coordinating with multiple departments and ensuring consistent implementation. My task was to develop and roll out the new protocol within 8 weeks while maintaining current service levels. I created a detailed implementation plan, established cross-departmental working groups, conducted regular progress meetings, and developed comprehensive training materials. The result was successful implementation across all offices, 30% improvement in customer response times, and positive feedback from both staff and customers.`;
    
    await secondQuestionTextarea.fill(secondAnswer);
    await page.getByRole('button', { name: 'Submit Answer' }).click();
    
    // Wait for AI evaluation
    await expect(page.getByText('AI Answer Evaluation')).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Next Question' }).click();
    
    // Step 9: Get upgrade prompt (should appear after 2 questions for free users)
    // Look for upgrade modal or prompt
    await expect(page.getByText(/Upgrade|Subscribe|Premium/i)).toBeVisible({ timeout: 10000 });
    
    // Step 10: Choose the starter package
    await page.getByRole('button', { name: /Interview Confidence Starter|€49/i }).click();
    
    // Step 11: Pay on Stripe using test card details
    await expect(page.url()).toContain('checkout.stripe.com');
    
    // Fill Stripe checkout form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="cardExpiry"]', '08/30');
    await page.fill('input[name="cardCvc"]', '123');
    await page.fill('input[name="billingName"]', 'Test User');
    
    await page.getByRole('button', { name: /Pay|Complete/i }).click();
    
    // Step 12: Redirect back to app from Stripe
    await expect(page.url()).toContain(process.env.BASE_URL || 'localhost');
    
    // Step 13: See thank you page for starter pack
    await expect(page.getByText(/Thank you|Payment successful/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Interview Confidence Starter|€49|1 interview/i)).toBeVisible();
    // Make sure it's NOT showing lifetime details
    await expect(page.getByText(/Lifetime|€149|Unlimited/i)).not.toBeVisible();
    
    // Step 14: Go to dashboard
    await page.getByRole('button', { name: /Dashboard|Continue/i }).click();
    await expect(page.getByText('Your Interviews')).toBeVisible();
    
    // Step 15: Create 1 interview
    for (let i = 1; i <= 3; i++) {
      await page.getByRole('button', { name: /New Interview/i }).click();
      
      await page.selectOption('select[name="grade"]', 'HEO');
      await page.selectOption('select[name="framework"]', '6-competency');
      await page.fill('input[name="jobTitle"]', `Test Interview ${i}`);
      
      await page.getByRole('button', { name: 'Start Interview' }).click();
      
      // Wait for interview to start then go back to dashboard
      await expect(page.getByText('Question 1 of 12')).toBeVisible({ timeout: 15000 });
      await page.goto('/app');
      await expect(page.getByText('Your Interviews')).toBeVisible();
    }
    
    // Step 16: Try create a 4th interview
    await page.getByRole('button', { name: /New Interview/i }).click();
    
    // Step 17: Get the upgrade prompt
    await expect(page.getByText(/upgrade|limit|1 interview/i)).toBeVisible({ timeout: 5000 });
    
    // Step 18: Choose the Lifetime package
    await page.getByRole('button', { name: /Lifetime Premium Access|€149/i }).click();
    
    // Step 19: Pay for package on Stripe using same card details
    await expect(page.url()).toContain('checkout.stripe.com');
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="cardExpiry"]', '08/30');
    await page.fill('input[name="cardCvc"]', '123');
    await page.fill('input[name="billingName"]', 'Test User');
    
    await page.getByRole('button', { name: /Pay|Complete/i }).click();
    
    // Step 20: Get redirected back to thank you page
    await expect(page.url()).toContain(process.env.BASE_URL || 'localhost');
    
    // Step 21: Check thank you page details about lifetime package
    await expect(page.getByText(/Thank you|Payment successful/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Lifetime Premium Access|€149|Unlimited/i)).toBeVisible();
    
    // Step 22: Create another interview
    await page.getByRole('button', { name: /Dashboard|Continue/i }).click();
    await page.getByRole('button', { name: /New Interview/i }).click();
    
    await page.selectOption('select[name="grade"]', 'HEO');
    await page.selectOption('select[name="framework"]', '6-competency');
    await page.fill('input[name="jobTitle"]', 'Post-Upgrade Interview');
    
    await page.getByRole('button', { name: 'Start Interview' }).click();
    await expect(page.getByText('Question 1 of 12')).toBeVisible({ timeout: 15000 });
    
    // Step 23: Logout
    await page.goto('/app');
    await page.locator('[data-testid="user-menu"]').or(page.getByRole('button', { name: /profile|account/i })).click();
    await page.getByRole('button', { name: /logout|sign out/i }).click();
    
    // Step 24: Clear Cookies and Session
    await context.clearCookies();
    await page.goto('/');
    
    // Step 25: Finish Test - verify we're back to logged out state
    await expect(page.getByText('Practice Questions for Public Service Jobs in Ireland')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
    
    console.log('✅ Full 25-step user journey completed successfully!');
  });
});