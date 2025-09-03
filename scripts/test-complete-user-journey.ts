import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testCompleteUserJourney() {
  console.log('🎯 Testing Complete User Journey with Timeline Tracking...\n');
  
  const baseUrl = 'http://localhost:5000';
  const testEmail = 'journey@publicserviceprep.ie';
  
  try {
    console.log('1️⃣ User Registration');
    const registrationResponse = await fetch(`${baseUrl}/api/crm/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        firstName: 'Journey',
        lastName: 'User',
        subscriptionStatus: 'free',
        lifecycleStage: 'lead'
      })
    });
    console.log(`   ✅ Registration: ${registrationResponse.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    
    // Wait a moment between activities
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n2️⃣ Feature Usage: CV Upload');
    const cvUploadResponse = await fetch(`${baseUrl}/api/crm/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        type: 'feature_usage',
        data: {
          feature: 'cv_upload',
          timestamp: new Date().toISOString()
        }
      })
    });
    console.log(`   ✅ CV Upload tracking: ${cvUploadResponse.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n3️⃣ Feature Usage: Interview Started');
    const interviewStartResponse = await fetch(`${baseUrl}/api/crm/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        type: 'feature_usage',
        data: {
          feature: 'interview_start',
          timestamp: new Date().toISOString()
        }
      })
    });
    console.log(`   ✅ Interview start tracking: ${interviewStartResponse.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n4️⃣ Feature Usage: AI Feedback Viewed');
    const aiFeedbackResponse = await fetch(`${baseUrl}/api/crm/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        type: 'feature_usage',
        data: {
          feature: 'ai_feedback_view',
          timestamp: new Date().toISOString()
        }
      })
    });
    console.log(`   ✅ AI Feedback tracking: ${aiFeedbackResponse.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n5️⃣ Feature Usage: Interview Completed');
    const interviewCompleteResponse = await fetch(`${baseUrl}/api/crm/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        type: 'feature_usage',
        data: {
          feature: 'interview_complete',
          timestamp: new Date().toISOString()
        }
      })
    });
    console.log(`   ✅ Interview completion tracking: ${interviewCompleteResponse.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n6️⃣ Page Navigation');
    const pageViewResponse = await fetch(`${baseUrl}/api/crm/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        type: 'page_view',
        data: {
          page: '/app/dashboard',
          timestamp: new Date().toISOString()
        }
      })
    });
    console.log(`   ✅ Page view tracking: ${pageViewResponse.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    
    console.log('\n🎉 Complete User Journey Test Finished!');
    console.log('\n📊 Timeline Created:');
    console.log('   • User Registration');
    console.log('   • CV Upload Activity');
    console.log('   • Interview Started');
    console.log('   • AI Feedback Viewed');
    console.log('   • Interview Completed');
    console.log('   • Dashboard Page Visit');
    console.log('\n💡 Check your Monday.com "Users" board Activities Timeline for journey@publicserviceprep.ie');
    console.log('   You should see 6 timeline entries showing the complete user journey!');
    
  } catch (error) {
    console.error('❌ Error in user journey test:', error);
  }
}

testCompleteUserJourney();
