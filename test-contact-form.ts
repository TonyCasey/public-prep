#!/usr/bin/env tsx

/**
 * Test Contact Form Email Functionality
 * 
 * This script tests the contact form email system by:
 * 1. Sending a test contact form notification to support@publicprep.ie
 * 2. Sending a test confirmation email to tcasey@publicprep.ie
 * 
 * Run with: npx tsx test-contact-form.ts
 */

import { sendContactFormNotification, sendContactConfirmationEmail } from './server/services/emailService';

async function testContactFormEmails() {
  console.log('🧪 Testing Contact Form Email System...\n');

  // Test data for contact form submission
  const testContactData = {
    name: 'Tom Casey',
    email: 'tcasey@publicprep.ie',
    subject: 'Testing Contact Form Email System',
    message: 'This is a test message to verify that the contact form email functionality is working correctly. The system should send:\n\n1. A notification to support@publicprep.ie with all form details\n2. A confirmation email to the person who submitted the form\n\nBoth emails should have beautiful HTML formatting with Public Prep branding.\n\nThanks!\nTom'
  };

  try {
    console.log('📧 Testing support notification email...');
    
    // Test 1: Send notification to support team
    const supportEmailSent = await sendContactFormNotification(testContactData);
    
    if (supportEmailSent) {
      console.log('✅ Support notification email sent successfully to support@publicprep.ie');
    } else {
      console.log('❌ Failed to send support notification email');
    }

    console.log('\n📧 Testing user confirmation email...');
    
    // Test 2: Send confirmation to form submitter
    const confirmationEmailSent = await sendContactConfirmationEmail(
      testContactData.email, 
      testContactData.name
    );
    
    if (confirmationEmailSent) {
      console.log('✅ User confirmation email sent successfully to tcasey@publicprep.ie');
    } else {
      console.log('❌ Failed to send user confirmation email');
    }

    console.log('\n📊 Test Results Summary:');
    console.log(`Support Notification: ${supportEmailSent ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`User Confirmation: ${confirmationEmailSent ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (supportEmailSent && confirmationEmailSent) {
      console.log('\n🎉 ALL TESTS PASSED! Contact form email system is fully operational.');
      console.log('\n📮 Check these inboxes:');
      console.log('   • support@publicprep.ie (for contact form notification)');
      console.log('   • tcasey@publicprep.ie (for confirmation email)');
    } else {
      console.log('\n⚠️  Some tests failed. Check SendGrid configuration and API key.');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run the test
testContactFormEmails().catch(console.error);