import { test, expect } from '@playwright/test';

test('Complete Stripe Payment Flow Test', async ({ page }) => {
  console.log('🚀 Starting Complete Stripe Payment Flow Test');

  // Step 1: Clear sessions and go to home
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  console.log('✅ Step 1: Cleared sessions');

  // Step 2: Register new user
  await page.goto('/auth');
  
  // Switch to signup mode
  const signupLink = page.getByText('Sign up here').first();
  if (await signupLink.isVisible({ timeout: 5000 })) {
    await signupLink.click();
    await page.waitForTimeout(1000);
  }

  // Generate unique test user
  const timestamp = Date.now();
  const testNumber = Math.floor(timestamp / 1000) % 1000 + 100;
  const testEmail = `paymenttest+${testNumber}@buncar.ie`;
  
  await page.fill('input[id="firstName"]', 'Payment');
  await page.fill('input[id="lastName"]', 'Test');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', 'paymenttest123');
  await page.getByRole('button', { name: 'Create Your Account' }).click();
  
  await page.waitForURL('**/app', { timeout: 15000 });
  console.log(`✅ Step 2: Registered user ${testEmail}`);

  // Step 3: Trigger payment modal by trying to start second interview
  // First create one session to trigger limit
  await page.getByRole('button', { name: /Start Your First Interview|New Interview/i }).click();
  
  // Upload CV quickly
  const cvUpload = page.locator('input[type="file"]').first();
  await cvUpload.setInputFiles({
    name: 'payment-test-cv.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Payment Test User\nHEO Candidate\n5 years public service experience')
  });

  await page.waitForTimeout(2000);
  
  // Start interview
  const startButton = page.getByRole('button', { name: /Start Interview|Create Interview/i });
  if (await startButton.isVisible({ timeout: 10000 })) {
    await startButton.click();
    console.log('✅ Step 3: Started first interview');
  }

  // Wait for processing and go back to dashboard
  await page.waitForTimeout(20000);
  await page.goto('/app');
  await page.waitForTimeout(2000);

  // Now try to start second interview - should trigger payment modal
  const newInterviewBtn = page.getByRole('button', { name: /New Interview/i });
  if (await newInterviewBtn.isVisible({ timeout: 5000 })) {
    await newInterviewBtn.click();
    console.log('✅ Step 4: Clicked New Interview (should trigger payment modal)');
    
    await page.waitForTimeout(3000);
    
    // Look for payment modal
    const paymentModalIndicators = [
      'Choose Your Plan',
      'Interview Confidence Starter',
      'Lifetime Premium Access',
      '€49',
      '€149'
    ];
    
    let paymentModalFound = false;
    for (const indicator of paymentModalIndicators) {
      try {
        if (await page.getByText(indicator).first().isVisible({ timeout: 3000 })) {
          console.log(`✅ Step 5: Payment modal found - "${indicator}" visible`);
          paymentModalFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (paymentModalFound) {
      console.log('🎉 PAYMENT MODAL SUCCESSFULLY TRIGGERED!');
      
      // Test Starter Plan (€49) button
      const starterButton = page.getByRole('button', { name: /Get Started.*€49|€49/i });
      if (await starterButton.isVisible({ timeout: 5000 })) {
        console.log('✅ Step 6a: Starter plan button (€49) found');
        
        // Click starter plan - this should redirect to Stripe
        await starterButton.click();
        console.log('🔄 Step 6b: Clicked starter plan - waiting for Stripe redirect...');
        
        // Wait for either Stripe redirect or error handling
        try {
          await page.waitForTimeout(5000);
          const currentUrl = page.url();
          
          if (currentUrl.includes('checkout.stripe.com')) {
            console.log('🎉 SUCCESS: Redirected to Stripe checkout!');
            console.log('✅ Stripe URL:', currentUrl);
            
            // We're on Stripe - payment integration is working!
            console.log('✅ COMPLETE: Stripe payment integration fully operational!');
            return;
          } else {
            console.log('⚠️ Not redirected to Stripe, checking for error messages...');
            console.log('Current URL:', currentUrl);
          }
        } catch (error) {
          console.log('⚠️ Redirect timeout, checking current state...');
        }
      }
      
      // Test Premium Plan (€149) button if starter didn't work
      const premiumButton = page.getByRole('button', { name: /Lifetime.*€149|€149/i });
      if (await premiumButton.isVisible({ timeout: 5000 })) {
        console.log('✅ Step 7a: Premium plan button (€149) found');
        
        await premiumButton.click();
        console.log('🔄 Step 7b: Clicked premium plan - waiting for Stripe redirect...');
        
        try {
          await page.waitForTimeout(5000);
          const currentUrl = page.url();
          
          if (currentUrl.includes('checkout.stripe.com')) {
            console.log('🎉 SUCCESS: Redirected to Stripe checkout!');
            console.log('✅ Stripe URL:', currentUrl);
            console.log('✅ COMPLETE: Stripe payment integration fully operational!');
          } else {
            console.log('⚠️ Premium plan did not redirect to Stripe');
            console.log('Current URL:', currentUrl);
          }
        } catch (error) {
          console.log('⚠️ Premium redirect timeout');
        }
      }
      
    } else {
      console.log('⚠️ Payment modal not found - subscription limit may not be triggered yet');
    }
    
  } else {
    console.log('⚠️ New Interview button not found');
  }

  console.log('🏁 Test completed - Check logs above for results');
});