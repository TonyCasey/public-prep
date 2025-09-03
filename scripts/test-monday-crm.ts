#!/usr/bin/env tsx
/**
 * Test Monday.com CRM Integration
 * Creates a test contact to verify the CRM is working
 */

import dotenv from 'dotenv';
dotenv.config();

// Direct API test since CRMService is running in the server

async function testMondayCRM() {
  console.log('🧪 Testing Monday.com CRM integration via API...');
  
  try {
    // Test the CRM API endpoint directly
    const baseUrl = 'http://localhost:5000';
    
    const testData = {
      email: 'test@publicserviceprep.ie',
      firstName: 'Test',
      lastName: 'User'
    };

    console.log('📝 Testing CRM contact creation via API...');
    
    const response = await fetch(`${baseUrl}/api/crm/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ CRM API response:', result);
    
    // Test activity tracking
    console.log('\n📝 Testing CRM activity tracking...');
    const activityResponse = await fetch(`${baseUrl}/api/crm/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testData.email,
        activity: 'cv_upload'
      })
    });

    if (activityResponse.ok) {
      const activityResult = await activityResponse.json();
      console.log('✅ Activity tracking response:', activityResult);
    }
    
    console.log('\n🎉 Monday.com CRM integration test complete!');
    console.log('💡 Check your Monday.com "Users" board to see if the test contact was created');
    
  } catch (error) {
    console.error('❌ Monday.com CRM test failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the test
testMondayCRM()
  .then(() => {
    console.log('\n✨ Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });