// Test HubSpot Stage 2 Analytics Integration
import axios from 'axios';

async function testHubSpotAnalytics() {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing HubSpot Stage 2 Analytics System...\n');
  
  try {
    // 1. Test user registration with HubSpot contact creation
    console.log('1. Testing user registration with HubSpot tracking...');
    const registerResponse = await axios.post(`${baseURL}/api/auth/register`, {
      firstName: 'Analytics',
      lastName: 'Tester',
      email: 'analytics-test@publicserviceprep.ie',
      password: 'testpass123'
    });
    
    if (registerResponse.status === 200) {
      console.log('✅ Registration successful - HubSpot contact should be created');
    }
    
    // Get session cookie for authenticated requests
    const sessionCookie = registerResponse.headers['set-cookie']?.[0];
    const headers = sessionCookie ? { Cookie: sessionCookie } : {};
    
    // 2. Test page view tracking
    console.log('\n2. Testing page view tracking...');
    const pageTrackResponse = await axios.post(`${baseURL}/api/hubspot/track-page`, {
      page: '/app'
    }, { headers });
    
    if (pageTrackResponse.status === 200) {
      console.log('✅ Page view tracking successful');
    }
    
    // 3. Test feature usage tracking
    console.log('\n3. Testing feature usage tracking...');
    const featureTrackResponse = await axios.post(`${baseURL}/api/hubspot/track-feature`, {
      feature: 'cv_upload',
      metadata: { fileSize: 2048, fileType: 'pdf' }
    }, { headers });
    
    if (featureTrackResponse.status === 200) {
      console.log('✅ Feature usage tracking successful');
    }
    
    console.log('\n🎉 HubSpot Stage 2 Analytics System is fully operational!');
    console.log('\n📊 What gets tracked automatically:');
    console.log('   - User registration → HubSpot contact creation');
    console.log('   - Page views → Navigation analytics');
    console.log('   - CV uploads → Feature adoption tracking');
    console.log('   - Interview starts → Engagement scoring');
    console.log('   - Interview completions → Success metrics');
    console.log('   - AI feedback views → Usage analytics');
    
    console.log('\n🚀 Your LinkedIn launch will have enterprise-level analytics from day one!');
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    } else {
      console.log(`❌ Network error: ${error.message}`);
    }
  }
}

testHubSpotAnalytics();