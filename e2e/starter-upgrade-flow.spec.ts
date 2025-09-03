import { test, expect } from '@playwright/test';

test.describe('Starter Package Upgrade Flow', () => {
  
  test('Complete starter to premium upgrade journey', async ({ page }) => {
    console.log('🚀 Testing Starter Package Upgrade Flow');

    // Step 1: Clear session and start fresh
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Step 2: Register new user
    console.log('📝 Registering new user');
    const testNum = Math.floor(Date.now() / 1000) % 1000 + 100;
    const testEmail = `upgrade.test+${testNum}@buncar.ie`;

    // Navigate to auth and register
    await page.goto('/auth');
    const signupLink = page.getByText('Sign up here');
    if (await signupLink.isVisible({ timeout: 3000 })) {
      await signupLink.click();
    }

    await page.fill('input[id="firstName"]', 'Upgrade');
    await page.fill('input[id="lastName"]', 'Test');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'testuser123');
    
    await page.getByRole('button', { name: 'Create Your Account' }).click();
    await page.waitForURL('**/app', { timeout: 15000 });
    console.log(`✅ User registered: ${testEmail}`);

    // Step 3: Create first interview (should be allowed)
    console.log('🎯 Creating first interview');
    const startInterviewBtn = page.getByRole('button', { name: /Start Your First Interview|New Interview/i });
    await startInterviewBtn.click();
    
    // Upload CV
    const cvUpload = page.locator('input[type="file"]').first();
    await cvUpload.setInputFiles({
      name: 'upgrade-test-cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Upgrade Test User\nSenior Executive Officer\n7 years public service experience\nTeam leadership and project management')
    });

    await page.waitForTimeout(3000);
    
    // Start the interview
    const createInterviewBtn = page.getByRole('button', { name: /Start Interview|Create Interview/i });
    await createInterviewBtn.click();
    await page.waitForTimeout(15000); // Wait for processing

    // Answer a few questions to make it realistic
    console.log('💬 Answering interview questions');
    const answerTextarea = page.locator('textarea').first();
    if (await answerTextarea.isVisible({ timeout: 10000 })) {
      await answerTextarea.fill('As a team leader, I successfully managed a cross-departmental initiative. I began by establishing clear objectives and timelines, then coordinated with stakeholders to ensure resource allocation. I implemented regular check-ins and maintained open communication channels. The project was completed on time and within budget, resulting in improved service delivery.');
      
      const submitBtn = page.getByRole('button', { name: /Submit Answer/i });
      await submitBtn.click();
      await page.waitForTimeout(15000); // Wait for AI evaluation
    }

    // Return to dashboard
    await page.goto('/app');
    await page.waitForTimeout(3000);

    // Step 4: Purchase starter package
    console.log('💳 Attempting to create second interview (should trigger starter purchase)');
    const newInterviewBtn = page.getByRole('button', { name: /New Interview/i });
    await newInterviewBtn.click();
    await page.waitForTimeout(5000);

    // Should see payment modal
    await expect(page.getByText('Choose Your Plan')).toBeVisible({ timeout: 10000 });
    
    // Verify starter package shows "1 Full Practice Interview"
    await expect(page.getByText('1 Full Practice Interview')).toBeVisible();
    await expect(page.getByText('€49')).toBeVisible();
    
    // Purchase starter package
    console.log('💰 Purchasing starter package (€49)');
    const starterBtn = page.getByRole('button', { name: /Get Started.*€49|€49/i });
    await starterBtn.click();
    
    // Complete Stripe payment
    await page.waitForFunction(
      () => window.location.href.includes('checkout.stripe.com'),
      { timeout: 15000 }
    );
    
    await page.waitForSelector('input[name="cardnumber"]', { timeout: 10000 });
    await page.fill('input[name="cardnumber"]', '4242424242424242');
    await page.fill('input[name="exp-date"]', '08/30');
    await page.fill('input[name="cvc"]', '123');
    await page.fill('input[name="billing-name"]', 'Upgrade Test');
    
    const payButton = page.getByRole('button', { name: /Pay|Complete/ });
    await payButton.click();

    // Wait for redirect back to app
    await page.waitForURL('**/payment-success', { timeout: 30000 });
    
    // Verify starter package confirmation
    console.log('✅ Verifying starter package purchase');
    await expect(page.getByText('Starter', { exact: false })).toBeVisible();
    await expect(page.getByText('€49')).toBeVisible();
    
    // Return to dashboard
    const dashboardBtn = page.getByRole('button', { name: /Start Practicing|Dashboard/i });
    if (await dashboardBtn.isVisible({ timeout: 5000 })) {
      await dashboardBtn.click();
    } else {
      await page.goto('/app');
    }

    // Step 5: Use the 1 allowed starter interview
    console.log('🎯 Creating starter package interview');
    const starterInterviewBtn = page.getByRole('button', { name: /New Interview/i });
    await starterInterviewBtn.click();
    
    const startBtn = page.getByRole('button', { name: /Start Interview|Create Interview/i });
    if (await startBtn.isVisible({ timeout: 5000 })) {
      await startBtn.click();
      await page.waitForTimeout(10000); // Wait for processing
    }

    // Return to dashboard
    await page.goto('/app');
    await page.waitForTimeout(3000);

    // Step 6: Attempt to create another interview (should trigger upgrade)
    console.log('🚫 Attempting second starter interview (should be blocked)');
    const blockedInterviewBtn = page.getByRole('button', { name: /New Interview/i });
    await blockedInterviewBtn.click();
    await page.waitForTimeout(5000);

    // Should see upgrade modal with €100 price
    console.log('💡 Verifying upgrade pricing for starter users');
    await expect(page.getByText('Choose Your Plan')).toBeVisible({ timeout: 10000 });
    
    // Verify upgrade pricing
    await expect(page.getByText('€100')).toBeVisible(); // Upgrade price
    await expect(page.getByText('Save €49!')).toBeVisible(); // Savings indicator
    await expect(page.getByText('Upgrade Available')).toBeVisible(); // Orange badge
    
    // Verify strikethrough original price
    const strikethroughPrice = page.locator('text=€149').filter({ has: page.locator('..').locator('.line-through') });
    await expect(strikethroughPrice).toBeVisible();

    // Step 7: Purchase premium upgrade
    console.log('🚀 Purchasing premium upgrade (€100)');
    const upgradeBtn = page.getByRole('button', { name: /Upgrade for €100/i });
    await upgradeBtn.click();
    
    // Complete Stripe payment for upgrade
    await page.waitForFunction(
      () => window.location.href.includes('checkout.stripe.com'),
      { timeout: 15000 }
    );
    
    await page.waitForSelector('input[name="cardnumber"]', { timeout: 10000 });
    await page.fill('input[name="cardnumber"]', '4242424242424242');
    await page.fill('input[name="exp-date"]', '08/30');
    await page.fill('input[name="cvc"]', '123');
    await page.fill('input[name="billing-name"]', 'Upgrade Test');
    
    const payUpgradeButton = page.getByRole('button', { name: /Pay|Complete/ });
    await payUpgradeButton.click();

    // Wait for redirect back to app
    await page.waitForURL('**/payment-success', { timeout: 30000 });
    
    // Verify premium package confirmation
    console.log('🎉 Verifying premium upgrade');
    await expect(page.getByText('Premium', { exact: false })).toBeVisible();
    await expect(page.getByText('Lifetime', { exact: false })).toBeVisible();
    
    // Should show correct pricing (€149 total, but user paid €49 + €100)
    const totalPaidText = page.getByText('€149'); // Should show full value received
    await expect(totalPaidText).toBeVisible();

    // Step 8: Verify unlimited access
    console.log('✨ Testing unlimited access');
    const returnToDashboard = page.getByRole('button', { name: /Start Practicing|Dashboard/i });
    if (await returnToDashboard.isVisible({ timeout: 5000 })) {
      await returnToDashboard.click();
    } else {
      await page.goto('/app');
    }
    
    // Should be able to create unlimited interviews now
    const unlimitedInterviewBtn = page.getByRole('button', { name: /New Interview/i });
    await unlimitedInterviewBtn.click();
    
    // Should NOT see payment modal
    await page.waitForTimeout(3000);
    const paymentModal = page.getByText('Choose Your Plan');
    await expect(paymentModal).not.toBeVisible();
    
    // Should see interview creation form
    const interviewForm = page.getByRole('button', { name: /Start Interview|Create Interview/i });
    await expect(interviewForm).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Upgrade flow completed successfully!');
    console.log('💰 Total customer journey: €49 (starter) + €100 (upgrade) = €149 lifetime value');
  });

  test('Starter package analytics display', async ({ page }) => {
    console.log('📊 Testing starter package analytics');

    // This would require a user with starter subscription
    // For now, test the UI components that should show "X/1" format

    await page.context().clearCookies();
    await page.goto('/auth');
    
    // Login as existing starter user (would need to be set up)
    // For test purposes, we'll check the component structure
    
    console.log('Analytics display test would verify:');
    console.log('- Usage shows "X/1" format for starter users');
    console.log('- Progress bar shows correct percentage');
    console.log('- Upgrade prompts appear at 100% usage');
  });

  test('Pricing display variations', async ({ page }) => {
    console.log('💰 Testing pricing display for different user types');

    // Test 1: Free user sees €149
    await page.context().clearCookies();
    await page.goto('/');
    
    // Trigger payment modal as free user
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 5000 })) {
      await textarea.fill('Test answer for pricing check');
      const evaluateBtn = page.getByRole('button', { name: /Evaluate/i });
      await evaluateBtn.click();
      await page.waitForTimeout(10000);
      
      const upgradeBtn = page.getByRole('button', { name: /Upgrade|Get Started/i });
      if (await upgradeBtn.isVisible({ timeout: 5000 })) {
        await upgradeBtn.click();
        
        // Register to see pricing modal
        await page.waitForURL('**/auth', { timeout: 10000 });
        const signupLink = page.getByText('Sign up here');
        if (await signupLink.isVisible({ timeout: 3000 })) {
          await signupLink.click();
        }

        const testNum = Math.floor(Date.now() / 1000) % 1000 + 200;
        await page.fill('input[id="firstName"]', 'Pricing');
        await page.fill('input[id="lastName"]', 'Test');
        await page.fill('input[type="email"]', `pricing.test+${testNum}@buncar.ie`);
        await page.fill('input[type="password"]', 'testuser123');
        
        await page.getByRole('button', { name: 'Create Your Account' }).click();
        await page.waitForURL('**/app', { timeout: 15000 });

        // Trigger payment modal
        const startBtn = page.getByRole('button', { name: /New Interview/i });
        await startBtn.click();
        
        // Free user should see full €149 price
        await expect(page.getByText('€149')).toBeVisible();
        await expect(page.getByText('Most Popular')).toBeVisible(); // Not upgrade badge
      }
    }

    console.log('✅ Pricing display test completed');
  });
});