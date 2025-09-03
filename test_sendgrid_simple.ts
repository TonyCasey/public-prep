import { MailService } from '@sendgrid/mail';

async function testSendGridSimple() {
  const mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY!);

  try {
    console.log('Testing simple SendGrid email...');
    
    const msg = {
      to: 'tcasey@publicprep.ie',
      from: {
        email: 'tcasey@publicprep.ie',
        name: 'Public Prep'
      }, // Using verified sender from your account
      subject: 'Test Email from Public Prep',
      text: 'This is a simple test email to verify SendGrid is working.',
      html: '<strong>This is a simple test email to verify SendGrid is working.</strong>',
    };

    const response = await mailService.send(msg);
    console.log('Email sent successfully!');
    console.log('Response:', response);
    
  } catch (error: any) {
    console.error('SendGrid error details:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.response && error.response.body && error.response.body.errors) {
      console.error('SendGrid API errors:', JSON.stringify(error.response.body.errors, null, 2));
    }
  }
}

testSendGridSimple();