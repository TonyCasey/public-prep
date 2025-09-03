import { 
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendInterviewCompletionEmail,
  sendPaymentConfirmationEmail,
  sendMilestoneAchievementEmail
} from './server/services/emailService.js';

async function sendSampleEmails() {
  const testEmail = 'tcasey@publicprep.ie';
  const testName = 'Tom';
  
  console.log('Sending sample emails to:', testEmail);
  console.log('='.repeat(50));

  try {
    // 1. Welcome Email
    console.log('1. Sending Welcome Email...');
    const welcomeResult = await sendWelcomeEmail(testEmail, testName);
    console.log('Welcome Email Result:', welcomeResult ? 'Success' : 'Failed');

    // 2. Password Reset Email
    console.log('2. Sending Password Reset Email...');
    const resetResult = await sendPasswordResetEmail(testEmail, 'sample-reset-token-12345', testName);
    console.log('Password Reset Email Result:', resetResult ? 'Success' : 'Failed');

    // 3. Interview Completion Email (Passing Score)
    console.log('3. Sending Interview Completion Email (Passing)...');
    const completionPassResult = await sendInterviewCompletionEmail(testEmail, testName, {
      jobTitle: 'Senior Executive Officer - Department of Health',
      overallScore: 78,
      competenciesPassed: 5,
      totalCompetencies: 6,
      duration: '45 minutes',
      grade: 'B+'
    });
    console.log('Interview Completion (Pass) Email Result:', completionPassResult ? 'Success' : 'Failed');

    // 4. Interview Completion Email (Failing Score)
    console.log('4. Sending Interview Completion Email (Failing)...');
    const completionFailResult = await sendInterviewCompletionEmail(testEmail, testName, {
      jobTitle: 'Assistant Principal Officer - Department of Finance',
      overallScore: 52,
      competenciesPassed: 3,
      totalCompetencies: 6,
      duration: '38 minutes',
      grade: 'C-'
    });
    console.log('Interview Completion (Fail) Email Result:', completionFailResult ? 'Success' : 'Failed');

    // 5. Payment Confirmation Email (Starter)
    console.log('5. Sending Payment Confirmation Email (Starter)...');
    const paymentStarterResult = await sendPaymentConfirmationEmail(testEmail, testName, 49, 'starter', 'EUR');
    console.log('Payment Confirmation (Starter) Email Result:', paymentStarterResult ? 'Success' : 'Failed');

    // 6. Payment Confirmation Email (Premium)
    console.log('6. Sending Payment Confirmation Email (Premium)...');
    const paymentPremiumResult = await sendPaymentConfirmationEmail(testEmail, testName, 149, 'premium', 'EUR');
    console.log('Payment Confirmation (Premium) Email Result:', paymentPremiumResult ? 'Success' : 'Failed');

    // 7. Milestone Achievement Email (First Interview)
    console.log('7. Sending Milestone Achievement Email (First Interview)...');
    const milestoneFirstResult = await sendMilestoneAchievementEmail(testEmail, testName, {
      type: 'first_interview',
      description: 'First Interview Completed!'
    });
    console.log('Milestone (First Interview) Email Result:', milestoneFirstResult ? 'Success' : 'Failed');

    // 8. Milestone Achievement Email (Competency Mastery)
    console.log('8. Sending Milestone Achievement Email (Competency Mastery)...');
    const milestoneMasteryResult = await sendMilestoneAchievementEmail(testEmail, testName, {
      type: 'competency_mastery',
      description: 'Team Leadership Mastery Achieved!',
      competency: 'team_leadership'
    });
    console.log('Milestone (Competency Mastery) Email Result:', milestoneMasteryResult ? 'Success' : 'Failed');

    // 9. Milestone Achievement Email (Score Improvement)
    console.log('9. Sending Milestone Achievement Email (Score Improvement)...');
    const milestoneScoreResult = await sendMilestoneAchievementEmail(testEmail, testName, {
      type: 'score_improvement',
      description: 'Significant Score Improvement!',
      competency: 'decision_making',
      oldScore: 65,
      newScore: 82
    });
    console.log('Milestone (Score Improvement) Email Result:', milestoneScoreResult ? 'Success' : 'Failed');

    // 10. Milestone Achievement Email (Consistency)
    console.log('10. Sending Milestone Achievement Email (Consistency)...');
    const milestoneConsistencyResult = await sendMilestoneAchievementEmail(testEmail, testName, {
      type: 'consistency',
      description: 'Consistent High Performance!'
    });
    console.log('Milestone (Consistency) Email Result:', milestoneConsistencyResult ? 'Success' : 'Failed');

    console.log('\n' + '='.repeat(50));
    console.log('All sample emails sent!');
    console.log('Check the inbox at:', testEmail);
    
  } catch (error) {
    console.error('Error sending sample emails:', error);
  }
}

// Run the function
sendSampleEmails();