import { MailService } from '@sendgrid/mail';
import { storage } from '../storage';

// Initialize SendGrid
let mailService: MailService | null = null;

function initializeEmailService() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not found. Email service disabled.');
    return false;
  }
  
  try {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid email service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize SendGrid:', error);
    return false;
  }
}

// Initialize on module load
const isEmailEnabled = initializeEmailService();

// Export function to check email service status
export function isEmailServiceEnabled(): boolean {
  return isEmailEnabled && !!process.env.SENDGRID_API_KEY && !!mailService;
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Send welcome email to new users
export async function sendWelcomeEmail(email: string, firstName?: string): Promise<boolean> {
  if (!isEmailServiceEnabled() || !mailService) {
    console.log('Email service not available - would send welcome email to:', email);
    return false;
  }

  const displayName = firstName || 'there';
  
  const emailParams: EmailParams = {
    to: email,
    from: 'tcasey@publicprep.ie', // Using verified sender
    subject: 'Welcome to Public Prep - Your Interview Success Journey Starts Now!',
    text: `
Hi ${displayName},

Welcome to Public Prep! We're excited to help you excel in your Irish Public Service interview.

Getting Started:
1. Upload your CV for AI analysis
2. Upload the job specification
3. Start practicing with AI-generated questions
4. Track your progress across all competencies

Our AI coaching system will help you master the STAR method and build confidence for your interview.

Ready to begin? Log in to your account and start your first practice session.

Best regards,
The Public Prep Team
    `,
    html: generateWelcomeEmailHTML(displayName, email)
  };

  return await sendEmail(emailParams);
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string, 
  resetToken: string, 
  firstName?: string
): Promise<boolean> {
  if (!isEmailServiceEnabled() || !mailService) {
    console.log('Email service not available - would send password reset to:', email);
    return false;
  }

  const displayName = firstName || 'there';
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const emailParams: EmailParams = {
    to: email,
    from: 'tcasey@publicprep.ie',
    subject: 'Reset Your Public Prep Password',
    text: `
Hi ${displayName},

You requested a password reset for your Public Prep account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this reset, please ignore this email.

Best regards,
The Public Prep Team
    `,
    html: generatePasswordResetHTML(displayName, resetUrl)
  };

  return await sendEmail(emailParams);
}

// Send interview completion congratulations
export async function sendInterviewCompletionEmail(
  email: string,
  firstName: string,
  sessionDetails: {
    jobTitle: string;
    overallScore: number;
    competenciesPassed: number;
    totalCompetencies: number;
    duration: string;
    grade: string;
  }
): Promise<boolean> {
  if (!isEmailServiceEnabled() || !mailService) {
    console.log('Email service not available - would send completion email to:', email);
    return false;
  }

  const passed = sessionDetails.overallScore >= 60;
  const subject = passed 
    ? 'Congratulations! You\'ve Completed Your Practice Interview' 
    : 'Practice Interview Complete - Keep Going, You\'re Improving!';

  const emailParams: EmailParams = {
    to: email,
    from: 'tcasey@publicprep.ie',
    subject,
    text: generateInterviewCompletionText(firstName, sessionDetails, passed),
    html: generateInterviewCompletionHTML(firstName, sessionDetails, passed)
  };

  return await sendEmail(emailParams);
}

// Send payment confirmation
export async function sendPaymentConfirmationEmail(
  email: string,
  firstName: string,
  amount: number,
  planType: 'starter' | 'premium',
  currency: string = 'EUR'
): Promise<boolean> {
  if (!isEmailServiceEnabled() || !mailService) {
    console.log('Email service not available - would send payment confirmation to:', email);
    return false;
  }

  const isStarter = planType === 'starter';
  const planName = isStarter ? 'Interview Confidence Starter' : 'Lifetime Premium Access';
  const planPrice = isStarter ? '€49' : '€149';

  const emailParams: EmailParams = {
    to: email,
    from: 'tcasey@publicprep.ie',
    subject: `Payment Confirmed - Welcome to ${planName}!`,
    text: isStarter ? `
Hi ${firstName},

Thank you for purchasing the Interview Confidence Starter package!

Payment Details:
- Amount: ${currency === 'EUR' ? '€' : currency}${amount}
- Plan: ${planName}
- Date: ${new Date().toLocaleDateString()}

Your starter package includes:
✓ 1 Full Practice Interview Session
✓ CV Analysis with AI Feedback
✓ STAR Method Coaching & Scoring
✓ All 6 Competency Areas Coverage
✓ 30 Days Access Period

Perfect for your upcoming interview preparation! Log in to your account to start practicing immediately.

Thank you for choosing Public Prep!

Best regards,
The Public Prep Team
    ` : `
Hi ${firstName},

Thank you for upgrading to Premium Public Prep!

Payment Details:
- Amount: ${currency === 'EUR' ? '€' : currency}${amount}
- Plan: ${planName}
- Date: ${new Date().toLocaleDateString()}

You now have unlimited access to:
✓ Unlimited AI interview practice
✓ Advanced competency analysis
✓ Detailed performance tracking
✓ Expert-level question difficulty
✓ Priority customer support

Log in to your account to start using your premium features immediately.

Thank you for investing in your career success!

Best regards,
The Public Prep Team
    `,
    html: generatePaymentConfirmationHTML(firstName, amount, planType, currency)
  };

  return await sendEmail(emailParams);
}

// Send contact form notification to support team
export async function sendContactFormNotification(
  contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }
): Promise<boolean> {
  if (!isEmailServiceEnabled() || !mailService) {
    console.log('Email service not available - would send contact notification');
    return false;
  }

  const emailParams: EmailParams = {
    to: 'support@publicprep.ie',
    from: 'tcasey@publicprep.ie',
    subject: `Contact Form: ${contactData.subject}`,
    text: `
New Contact Form Submission

From: ${contactData.name} (${contactData.email})
Subject: ${contactData.subject}

Message:
${contactData.message}

---
Submitted at: ${new Date().toLocaleString('en-IE')}
    `,
    html: generateContactFormHTML(contactData)
  };

  return await sendEmail(emailParams);
}

// Send confirmation email to contact form submitter
export async function sendContactConfirmationEmail(
  email: string,
  name: string
): Promise<boolean> {
  if (!isEmailServiceEnabled() || !mailService) {
    console.log('Email service not available - would send contact confirmation to:', email);
    return false;
  }

  const emailParams: EmailParams = {
    to: email,
    from: 'tcasey@publicprep.ie',
    subject: 'Thank you for contacting Public Prep',
    text: `
Hi ${name},

Thank you for reaching out to Public Prep! We've received your message and will get back to you within 24 hours.

In the meantime, feel free to explore our AI-powered interview preparation platform at ${process.env.FRONTEND_URL || 'http://localhost:5000'}.

Best regards,
The Public Prep Team
    `,
    html: generateContactConfirmationHTML(name)
  };

  return await sendEmail(emailParams);
}

// Send milestone achievement notification
export async function sendMilestoneAchievementEmail(
  email: string,
  firstName: string,
  milestone: {
    type: 'first_interview' | 'competency_mastery' | 'score_improvement' | 'consistency';
    description: string;
    competency?: string;
    oldScore?: number;
    newScore?: number;
  }
): Promise<boolean> {
  if (!isEmailServiceEnabled() || !mailService) {
    console.log('Email service not available - would send milestone email to:', email);
    return false;
  }

  const emailParams: EmailParams = {
    to: email,
    from: 'tcasey@publicprep.ie',
    subject: `🎉 Milestone Achievement: ${milestone.description}`,
    text: generateMilestoneText(firstName, milestone),
    html: generateMilestoneHTML(firstName, milestone)
  };

  return await sendEmail(emailParams);
}

// Core email sending function
export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!isEmailServiceEnabled() || !mailService) {
    console.log('Email service not available - skipping email send');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from || 'tcasey@publicprep.ie',
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    
    console.log('Email sent successfully to:', params.to);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}



// HTML Email Templates

// Generate contact form notification HTML template
function generateContactFormHTML(contactData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  const headerGradient = 'linear-gradient(135deg, #a855f7, #ec4899)';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        }
        
        .header {
          background: ${headerGradient};
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .contact-details {
          background: #f8fafc;
          padding: 25px;
          border-radius: 12px;
          margin: 20px 0;
          border-left: 4px solid #a855f7;
        }
        
        .detail-row {
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .detail-row:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        
        .detail-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 5px;
        }
        
        .detail-value {
          color: #6b7280;
          line-height: 1.6;
        }
        
        .message-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          white-space: pre-wrap;
          line-height: 1.6;
        }
        
        .timestamp {
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #f3f4f6;
        }
        
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        
        .footer-divider {
          width: 60px;
          height: 2px;
          background: ${headerGradient};
          margin: 0 auto 20px;
          border-radius: 1px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>📧 New Contact Form Submission</h1>
        </div>
        
        <div class="content">
          <p>A new contact form submission has been received through the Public Prep website.</p>
          
          <div class="contact-details">
            <div class="detail-row">
              <div class="detail-label">Name:</div>
              <div class="detail-value">${contactData.name}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Email:</div>
              <div class="detail-value">${contactData.email}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Subject:</div>
              <div class="detail-value">${contactData.subject}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Message:</div>
              <div class="message-content">${contactData.message}</div>
            </div>
          </div>
          
          <div class="timestamp">
            Submitted at: ${new Date().toLocaleString('en-IE', { 
              timeZone: 'Europe/Dublin',
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-divider"></div>
          Public Prep Support System<br>
          This is an automated notification from the contact form.
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate contact confirmation HTML template
function generateContactConfirmationHTML(name: string): string {
  const headerGradient = 'linear-gradient(135deg, #a855f7, #ec4899)';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank you for contacting Public Prep</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        }
        
        .header {
          background: ${headerGradient};
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .greeting {
          font-size: 18px;
          color: #374151;
          margin-bottom: 20px;
        }
        
        .message-box {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          padding: 25px;
          border-radius: 12px;
          margin: 30px 0;
          border-left: 4px solid #a855f7;
        }
        
        .cta-section {
          text-align: center;
          margin: 40px 0;
        }
        
        .cta-button {
          display: inline-block;
          background: ${headerGradient};
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 10px 25px rgba(168, 85, 247, 0.3);
          transition: all 0.3s ease;
        }
        
        .signature {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #f3f4f6;
        }
        
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.5;
        }
        
        .footer-divider {
          width: 60px;
          height: 2px;
          background: ${headerGradient};
          margin: 0 auto 20px;
          border-radius: 1px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>✉️ Message Received</h1>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${name},</div>
          
          <p>Thank you for reaching out to Public Prep! We've received your message and appreciate you taking the time to contact us.</p>
          
          <div class="message-box">
            <p><strong>What happens next?</strong></p>
            <p>Our support team will review your message and get back to you within 24 hours. We're committed to providing you with the help and information you need for your Public Service interview preparation.</p>
          </div>
          
          <p>In the meantime, feel free to explore our AI-powered interview preparation platform:</p>
          
          <div class="cta-section">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" class="cta-button">
              🚀 Start Practicing Now
            </a>
          </div>
          
          <p>Our platform offers:</p>
          <ul>
            <li>✨ AI-powered question generation for all Public Service grades</li>
            <li>📋 CV analysis and competency matching</li>
            <li>⭐ STAR method coaching and feedback</li>
            <li>📊 Performance tracking and improvement insights</li>
          </ul>
          
          <div class="signature">
            <p>Best regards,<br>
            <strong>The Public Prep Team</strong><br>
            <em>Helping candidates excel in Ireland's Public Service interviews</em></p>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-divider"></div>
          Public Prep - AI Interview Preparation<br>
          Email: support@publicprep.ie<br>
          This email was sent because you contacted us through our website.
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateWelcomeEmailHTML(firstName: string, email: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Public Prep</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 50%, #e0e7ff 100%);
      margin: 0;
      padding: 20px 0;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    }
    
    .header {
      background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #6366f1 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }
    
    .header-content {
      position: relative;
      z-index: 1;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .tagline {
      font-size: 18px;
      opacity: 0.95;
      font-weight: 300;
    }
    
    .content {
      padding: 40px 30px;
      background: #ffffff;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    
    .intro-text {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    
    .steps-section {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 16px;
      padding: 30px;
      margin: 30px 0;
      border: 1px solid #e2e8f0;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #a855f7, #ec4899);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-left: 4px solid;
    }
    
    .step:nth-child(2) { border-left-color: #a855f7; }
    .step:nth-child(3) { border-left-color: #ec4899; }
    .step:nth-child(4) { border-left-color: #6366f1; }
    
    .step-number {
      background: linear-gradient(135deg, #a855f7, #ec4899);
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      margin-right: 16px;
      flex-shrink: 0;
    }
    
    .step-content {
      flex: 1;
    }
    
    .step-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }
    
    .step-description {
      color: #6b7280;
      font-size: 14px;
    }
    
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #6366f1 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 10px 25px rgba(168, 85, 247, 0.3);
      transition: all 0.3s ease;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(168, 85, 247, 0.4);
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 30px 0;
    }
    
    .feature-item {
      background: white;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      text-align: center;
    }
    
    .feature-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #a855f7, #ec4899);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      font-size: 20px;
    }
    
    .feature-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .feature-description {
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
    }
    
    .closing-text {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      padding: 25px;
      border-radius: 12px;
      margin: 30px 0;
      border-left: 4px solid #a855f7;
    }
    
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #f3f4f6;
    }
    
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
    }
    
    .footer-divider {
      width: 60px;
      height: 2px;
      background: linear-gradient(135deg, #a855f7, #ec4899);
      margin: 0 auto 20px;
      border-radius: 1px;
    }
    
    @media (max-width: 600px) {
      .email-container {
        margin: 0 10px;
        border-radius: 16px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
      }
      
      .steps-section {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-content">
        <div class="logo">Public Prep</div>
        <div class="tagline">Your AI-powered interview coaching starts now</div>
      </div>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${firstName}! 👋</div>
      
      <div class="intro-text">
        Welcome to Ireland's premier AI-powered interview preparation platform for Public Service careers! 
        We're thrilled to have you join our community of successful candidates.
      </div>
      
      <div class="steps-section">
        <div class="section-title">🚀 Get Started in 3 Simple Steps</div>
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">Upload Your CV</div>
            <div class="step-description">Our AI analyzes your experience and matches it to competency requirements</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-title">Upload Job Specification</div>
            <div class="step-description">Get tailored questions specifically designed for your target role</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-title">Practice Interviews</div>
            <div class="step-description">Master the STAR method with real-time AI coaching and feedback</div>
          </div>
        </div>
      </div>
      
      <div class="cta-section">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/app" class="cta-button">
          Start Your First Practice Session
        </a>
      </div>
      
      <div class="section-title">✨ What You'll Master</div>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon">⭐</div>
          <div class="feature-title">STAR Method</div>
          <div class="feature-description">Structure perfect answers using Situation, Task, Action, Result</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🎯</div>
          <div class="feature-title">Competency Confidence</div>
          <div class="feature-description">Excel in all 6 HEO competencies with targeted practice</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🤖</div>
          <div class="feature-title">Real-Time Coaching</div>
          <div class="feature-description">Get instant AI feedback on every answer you provide</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <div class="feature-title">Progress Tracking</div>
          <div class="feature-description">Watch your scores improve with detailed analytics</div>
        </div>
      </div>
      
      <div class="closing-text">
        <strong>Our AI coaching system has helped hundreds of candidates succeed in Irish Public Service interviews.</strong> 
        You're in excellent hands, and we're here to support your journey to interview success.
      </div>
      
      <div class="signature">
        <p><strong>Ready to transform your interview performance?</strong></p>
        <p>Best regards,<br>
        <strong>The Public Prep Team</strong></p>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-divider"></div>
      <p>This email was sent to ${email}</p>
      <p>You're receiving this because you created an account with Public Prep</p>
      <p>© 2025 Public Prep - Ireland's #1 Public Service Interview Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePasswordResetHTML(firstName: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Public Prep</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 50%, #e0e7ff 100%);
      margin: 0;
      padding: 20px 0;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    }
    
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }
    
    .header-content {
      position: relative;
      z-index: 1;
    }
    
    .security-icon {
      width: 64px;
      height: 64px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 28px;
      border: 2px solid rgba(255,255,255,0.3);
    }
    
    .logo {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .tagline {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 300;
    }
    
    .content {
      padding: 40px 30px;
      background: #ffffff;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    
    .intro-text {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
      transition: all 0.3s ease;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(220, 38, 38, 0.4);
    }
    
    .warning-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 16px;
      padding: 24px;
      margin: 30px 0;
      position: relative;
    }
    
    .warning-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 20px;
      color: white;
    }
    
    .warning-title {
      font-weight: 700;
      color: #92400e;
      margin-bottom: 8px;
      text-align: center;
      font-size: 18px;
    }
    
    .warning-text {
      color: #92400e;
      text-align: center;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .security-info {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #0ea5e9;
      border-radius: 16px;
      padding: 24px;
      margin: 30px 0;
    }
    
    .security-title {
      font-weight: 600;
      color: #0c4a6e;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      font-size: 16px;
    }
    
    .security-list {
      color: #075985;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .security-list li {
      margin-bottom: 8px;
      padding-left: 8px;
    }
    
    .help-section {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      padding: 25px;
      border-radius: 12px;
      margin: 30px 0;
      border-left: 4px solid #a855f7;
      text-align: center;
    }
    
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #f3f4f6;
    }
    
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
    }
    
    .footer-divider {
      width: 60px;
      height: 2px;
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      margin: 0 auto 20px;
      border-radius: 1px;
    }
    
    @media (max-width: 600px) {
      .email-container {
        margin: 0 10px;
        border-radius: 16px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .warning-section, .security-info {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-content">
        <div class="security-icon">🔒</div>
        <div class="logo">Public Prep</div>
        <div class="tagline">Password Reset Request</div>
      </div>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${firstName}! 👋</div>
      
      <div class="intro-text">
        You requested a password reset for your Public Prep account. Click the button below to create a new password and regain access to your interview preparation tools.
      </div>
      
      <div class="cta-section">
        <a href="${resetUrl}" class="cta-button">
          Reset Your Password
        </a>
      </div>
      
      <div class="warning-section">
        <div class="warning-icon">⏰</div>
        <div class="warning-title">Important Security Notice</div>
        <div class="warning-text">
          This reset link expires in <strong>1 hour</strong> for your security. 
          If you need a new link, simply request another password reset.
        </div>
      </div>
      
      <div class="security-info">
        <div class="security-title">
          🛡️ Security Guidelines
        </div>
        <ul class="security-list">
          <li>Only click the reset button if you requested this password change</li>
          <li>Choose a strong password with at least 8 characters</li>
          <li>Include uppercase, lowercase, numbers, and special characters</li>
          <li>Don't reuse passwords from other accounts</li>
        </ul>
      </div>
      
      <div class="help-section">
        <p><strong>Didn't request this reset?</strong></p>
        <p>If you didn't request this password reset, please ignore this email. Your account remains secure and no changes will be made.</p>
        <p>Need help? Contact our support team for assistance.</p>
      </div>
      
      <div class="signature">
        <p><strong>Stay secure and keep practicing!</strong></p>
        <p>Best regards,<br>
        <strong>The Public Prep Team</strong></p>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-divider"></div>
      <p>This password reset link will expire in 1 hour for security</p>
      <p>© 2025 Public Prep - Ireland's #1 Public Service Interview Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateInterviewCompletionText(firstName: string, details: any, passed: boolean): string {
  return `
Hi ${firstName},

${passed ? 'Congratulations!' : 'Well done!'} You've completed your practice interview for ${details.jobTitle}.

Results Summary:
- Overall Score: ${details.overallScore}%
- Grade Level: ${details.grade.toUpperCase()}
- Duration: ${details.duration}
- Competencies Passed: ${details.competenciesPassed}/${details.totalCompetencies}

${passed 
  ? 'Excellent work! You\'ve met the interview standard. Keep practicing to maintain your confidence.'
  : 'You\'re making great progress! Focus on the areas for improvement and practice more to boost your score.'
}

Your detailed results and AI feedback are available in your dashboard.

Keep practicing - every session makes you stronger!

Best regards,
The Public Prep Team
  `;
}

function generateInterviewCompletionHTML(firstName: string, details: any, passed: boolean): string {
  const statusGradient = passed 
    ? 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)'
    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)';
  const statusMessage = passed ? 'Interview Standard Met!' : 'Keep Practicing - You\'re Improving!';
  const encouragementIcon = passed ? '🎉' : '💪';
  const scoreColor = passed ? '#10b981' : '#f59e0b';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Complete - Public Prep</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 50%, #e0e7ff 100%);
      margin: 0;
      padding: 20px 0;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    }
    
    .header {
      background: ${statusGradient};
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }
    
    .header-content {
      position: relative;
      z-index: 1;
    }
    
    .celebration-icon {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 36px;
      border: 3px solid rgba(255,255,255,0.3);
      animation: celebrationPulse 2s ease-in-out infinite;
    }
    
    @keyframes celebrationPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .logo {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .status-message {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .job-title {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 300;
    }
    
    .content {
      padding: 40px 30px;
      background: #ffffff;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 30px;
    }
    
    .score-section {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      margin: 30px 0;
      border: 1px solid #e2e8f0;
      position: relative;
      overflow: hidden;
    }
    
    .score-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${statusGradient};
    }
    
    .score-display {
      font-size: 64px;
      font-weight: 800;
      color: ${scoreColor};
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .score-label {
      font-size: 18px;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 20px;
    }
    
    .score-context {
      font-size: 14px;
      color: #9ca3af;
      font-style: italic;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
    }
    
    .detail-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      transition: all 0.3s ease;
    }
    
    .detail-card:hover {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    
    .detail-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #a855f7, #ec4899);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      font-size: 20px;
      color: white;
    }
    
    .detail-value {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }
    
    .detail-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .encouragement-section {
      background: ${passed 
        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
        : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
      };
      border: 1px solid ${passed ? '#10b981' : '#f59e0b'};
      border-radius: 16px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
    }
    
    .encouragement-icon {
      width: 56px;
      height: 56px;
      background: ${passed 
        ? 'linear-gradient(135deg, #10b981, #059669)'
        : 'linear-gradient(135deg, #f59e0b, #d97706)'
      };
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 24px;
      color: white;
    }
    
    .encouragement-title {
      font-size: 20px;
      font-weight: 700;
      color: ${passed ? '#065f46' : '#92400e'};
      margin-bottom: 12px;
    }
    
    .encouragement-text {
      color: ${passed ? '#047857' : '#b45309'};
      line-height: 1.6;
      font-size: 15px;
    }
    
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #6366f1 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 10px 25px rgba(168, 85, 247, 0.3);
      transition: all 0.3s ease;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(168, 85, 247, 0.4);
    }
    
    .next-steps {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      padding: 25px;
      border-radius: 12px;
      margin: 30px 0;
      border-left: 4px solid #a855f7;
    }
    
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #f3f4f6;
    }
    
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
    }
    
    .footer-divider {
      width: 60px;
      height: 2px;
      background: ${statusGradient};
      margin: 0 auto 20px;
      border-radius: 1px;
    }
    
    @media (max-width: 600px) {
      .email-container {
        margin: 0 10px;
        border-radius: 16px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .details-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .score-section {
        padding: 30px 20px;
      }
      
      .score-display {
        font-size: 48px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-content">
        <div class="celebration-icon">${encouragementIcon}</div>
        <div class="logo">Public Prep</div>
        <div class="status-message">${statusMessage}</div>
        <div class="job-title">Your ${details.jobTitle} practice interview is complete</div>
      </div>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${firstName}! 👋</div>
      
      <div class="score-section">
        <div class="score-display">${details.overallScore}%</div>
        <div class="score-label">Overall Interview Score</div>
        <div class="score-context">${passed ? 'Interview Standard Achieved!' : 'Keep practicing to reach 70%+'}</div>
      </div>
      
      <div class="details-grid">
        <div class="detail-card">
          <div class="detail-icon">🎯</div>
          <div class="detail-value">${details.grade.toUpperCase()}</div>
          <div class="detail-label">Grade Level</div>
        </div>
        <div class="detail-card">
          <div class="detail-icon">⏱️</div>
          <div class="detail-value">${details.duration}</div>
          <div class="detail-label">Duration</div>
        </div>
        <div class="detail-card">
          <div class="detail-icon">✅</div>
          <div class="detail-value">${details.competenciesPassed}/${details.totalCompetencies}</div>
          <div class="detail-label">Competencies Passed</div>
        </div>
        <div class="detail-card">
          <div class="detail-icon">📋</div>
          <div class="detail-value">${details.jobTitle}</div>
          <div class="detail-label">Position</div>
        </div>
      </div>
      
      <div class="encouragement-section">
        <div class="encouragement-icon">${passed ? '🏆' : '💪'}</div>
        <div class="encouragement-title">${passed ? 'Excellent Work!' : 'You\'re Making Great Progress!'}</div>
        <div class="encouragement-text">
          ${passed 
            ? 'You\'ve demonstrated strong interview readiness and met the interview standard. Keep practicing to maintain your confidence and continue refining your technique for even better performance.'
            : 'Focus on the improvement areas highlighted in your detailed feedback. Each practice session strengthens your interview skills and brings you closer to mastering the competencies.'
          }
        </div>
      </div>
      
      <div class="cta-section">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/app" class="cta-button">
          View Detailed Results & Feedback
        </a>
      </div>
      
      <div class="next-steps">
        <p><strong>Your comprehensive analysis is ready:</strong></p>
        <p>• Detailed competency breakdown with scores<br>
        • AI feedback on each answer with improvement suggestions<br>
        • STAR method analysis and coaching tips<br>
        • Personalized practice recommendations</p>
      </div>
      
      <div class="signature">
        <p><strong>Keep practicing - every session makes you stronger!</strong></p>
        <p>Best regards,<br>
        <strong>The Public Prep Team</strong></p>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-divider"></div>
      <p>Continue your interview preparation journey</p>
      <p>© 2025 Public Prep - Ireland's #1 Public Service Interview Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePaymentConfirmationHTML(firstName: string, amount: number, planType: 'starter' | 'premium', currency: string): string {
  const isStarter = planType === 'starter';
  const planName = isStarter ? 'Interview Confidence Starter' : 'Lifetime Premium Access';
  const headerTitle = isStarter ? 'Welcome to Starter!' : 'Welcome to Premium!';
  const headerIcon = isStarter ? '🎯' : '🚀';
  const headerGradient = isStarter 
    ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #a855f7 100%)' 
    : 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #6366f1 100%)';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed - Welcome to ${planName}!</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 50%, #e0e7ff 100%);
      margin: 0;
      padding: 20px 0;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    }
    
    .header {
      background: ${headerGradient};
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }
    
    .header-content {
      position: relative;
      z-index: 1;
    }
    
    .success-icon {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 36px;
      border: 3px solid rgba(255,255,255,0.3);
      animation: successPulse 2s ease-in-out infinite;
    }
    
    @keyframes successPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .logo {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .header-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .header-subtitle {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 300;
    }
    
    .content {
      padding: 40px 30px;
      background: #ffffff;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    
    .intro-text {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    
    .payment-section {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 16px;
      padding: 30px;
      margin: 30px 0;
      border: 1px solid #e2e8f0;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
      background: ${headerGradient};
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .payment-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .payment-item {
      background: white;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      text-align: center;
    }
    
    .payment-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .payment-value {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
    }
    
    .amount-highlight {
      font-size: 32px;
      font-weight: 800;
      background: ${headerGradient};
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .status-confirmed {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #059669;
      font-weight: 600;
    }
    
    .features-section {
      background: ${isStarter 
        ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
        : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)'
      };
      border: 1px solid ${isStarter ? '#3b82f6' : '#a855f7'};
      border-radius: 16px;
      padding: 30px;
      margin: 30px 0;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-top: 20px;
    }
    
    .feature-item {
      background: white;
      padding: 16px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-left: 4px solid ${isStarter ? '#3b82f6' : '#a855f7'};
    }
    
    .feature-check {
      width: 24px;
      height: 24px;
      background: ${isStarter ? '#3b82f6' : '#a855f7'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }
    
    .feature-text {
      font-size: 15px;
      color: #1f2937;
      font-weight: 500;
    }
    
    .feature-highlight {
      font-weight: 700;
      color: ${isStarter ? '#1d4ed8' : '#7c3aed'};
    }
    
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: ${headerGradient};
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 10px 25px rgba(168, 85, 247, 0.3);
      transition: all 0.3s ease;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(168, 85, 247, 0.4);
    }
    
    .value-proposition {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      padding: 25px;
      border-radius: 12px;
      margin: 30px 0;
      border-left: 4px solid #a855f7;
      text-align: center;
    }
    
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #f3f4f6;
    }
    
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
    }
    
    .footer-divider {
      width: 60px;
      height: 2px;
      background: ${headerGradient};
      margin: 0 auto 20px;
      border-radius: 1px;
    }
    
    @media (max-width: 600px) {
      .email-container {
        margin: 0 10px;
        border-radius: 16px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .payment-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .payment-section, .features-section {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-content">
        <div class="success-icon">${headerIcon}</div>
        <div class="logo">Public Prep</div>
        <div class="header-title">${headerTitle}</div>
        <div class="header-subtitle">Your payment has been confirmed</div>
      </div>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${firstName}! 👋</div>
      
      <div class="intro-text">
        Thank you for purchasing <strong>${planName}</strong>! Your payment has been successfully processed and your premium features are now active.
      </div>
      
      <div class="payment-section">
        <div class="section-title">💳 Payment Summary</div>
        <div class="payment-grid">
          <div class="payment-item">
            <div class="payment-label">Amount Paid</div>
            <div class="payment-value amount-highlight">${currency === 'EUR' ? '€' : currency}${amount}</div>
          </div>
          <div class="payment-item">
            <div class="payment-label">Plan Selected</div>
            <div class="payment-value">${planName}</div>
          </div>
          <div class="payment-item">
            <div class="payment-label">Purchase Date</div>
            <div class="payment-value">${new Date().toLocaleDateString()}</div>
          </div>
          <div class="payment-item">
            <div class="payment-label">Status</div>
            <div class="payment-value status-confirmed">
              <span>✅</span>
              <span>Confirmed</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="features-section">
        <div class="section-title">${headerIcon} Your ${isStarter ? 'Starter' : 'Premium'} Benefits (Active Now!)</div>
        <div class="features-grid">
          ${isStarter ? `
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text"><span class="feature-highlight">1 Full Practice Interview Session</span> - Complete interview simulation</div>
          </div>
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text"><span class="feature-highlight">CV Analysis with AI Feedback</span> - Optimize your application</div>
          </div>
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text"><span class="feature-highlight">STAR Method Coaching & Scoring</span> - Master interview techniques</div>
          </div>
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text"><span class="feature-highlight">All 6 Competency Areas Coverage</span> - Complete preparation</div>
          </div>
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text"><span class="feature-highlight">30 Days Access Period</span> - Perfect for focused preparation</div>
          </div>
          ` : `
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text"><span class="feature-highlight">Unlimited AI Interview Practice</span> - No session limits</div>
          </div>
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text"><span class="feature-highlight">Advanced Competency Analysis</span> - Deep performance insights</div>
          </div>
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text"><span class="feature-highlight">Detailed Performance Tracking</span> - Comprehensive progress monitoring</div>
          </div>
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text"><span class="feature-highlight">Expert-Level Question Difficulty</span> - Advanced interview challenges</div>
          </div>
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text"><span class="feature-highlight">Priority Customer Support</span> - Direct access to our team</div>
          </div>
          <div class="feature-item">
            <div class="feature-check">✓</div>
            <div class="feature-text"><span class="feature-highlight">Lifetime Access - No Renewals</span> - One-time payment, forever access</div>
          </div>
          `}
        </div>
      </div>
      
      <div class="cta-section">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/app" class="cta-button">
          Start ${isStarter ? 'Practicing Now' : 'Using Premium Features'}
        </a>
      </div>
      
      <div class="value-proposition">
        <p><strong>${isStarter 
          ? 'Perfect for your upcoming interview preparation! Your starter features are active immediately.' 
          : 'Your premium features are active immediately. Experience the full power of AI-driven interview coaching!'
        }</strong></p>
        <p>We're here to help you excel in your Public Service interview and achieve your career goals.</p>
      </div>
      
      <div class="signature">
        <p><strong>Thank you for ${isStarter ? 'choosing' : 'investing in your career success with'} Public Prep!</strong></p>
        <p>Best regards,<br>
        <strong>The Public Prep Team</strong></p>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-divider"></div>
      <p>Your ${planName} is now active</p>
      <p>© 2025 Public Prep - Ireland's #1 Public Service Interview Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateMilestoneText(firstName: string, milestone: any): string {
  return `
Hi ${firstName},

Congratulations! You've achieved a new milestone: ${milestone.description}

${milestone.type === 'competency_mastery' ? `You've mastered the ${milestone.competency} competency! Your consistent high scores show real interview readiness.` : ''}
${milestone.type === 'score_improvement' ? `Your scores have improved from ${milestone.oldScore}% to ${milestone.newScore}% - excellent progress!` : ''}
${milestone.type === 'first_interview' ? 'You\'ve completed your first practice interview! This is the beginning of your interview success journey.' : ''}
${milestone.type === 'consistency' ? 'You\'ve demonstrated consistent performance across multiple interviews. Your preparation is paying off!' : ''}

Keep up the excellent work! Every milestone brings you closer to interview success.

View your progress dashboard to see your improvement journey.

Best regards,
The Public Prep Team
  `;
}

function generateMilestoneHTML(firstName: string, milestone: any): string {
  const milestoneTypeInfo = {
    'first_interview': {
      icon: '🎯',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #a855f7 100%)',
      title: 'First Interview Complete!',
      message: 'You\'ve completed your first practice interview! This is the beginning of your interview success journey.'
    },
    'competency_mastery': {
      icon: '🏆',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
      title: 'Competency Mastered!',
      message: `You've mastered the ${milestone.competency} competency! Your consistent high scores show real interview readiness.`
    },
    'score_improvement': {
      icon: '📈',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
      title: 'Score Improvement!',
      message: `Your scores have improved from ${milestone.oldScore}% to ${milestone.newScore}% - excellent progress!`
    },
    'consistency': {
      icon: '⭐',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #7c3aed 100%)',
      title: 'Consistent Performance!',
      message: 'You\'ve demonstrated consistent performance across multiple interviews. Your preparation is paying off!'
    }
  };

  const info = milestoneTypeInfo[milestone.type as keyof typeof milestoneTypeInfo] || milestoneTypeInfo['first_interview'];
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Milestone Achievement - Public Prep</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 50%, #e0e7ff 100%);
      margin: 0;
      padding: 20px 0;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    }
    
    .header {
      background: ${info.gradient};
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }
    
    .header-content {
      position: relative;
      z-index: 1;
    }
    
    .achievement-icon {
      width: 100px;
      height: 100px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 48px;
      border: 4px solid rgba(255,255,255,0.3);
      animation: achievementBounce 2s ease-in-out infinite;
    }
    
    @keyframes achievementBounce {
      0%, 100% { transform: scale(1) rotate(0deg); }
      25% { transform: scale(1.05) rotate(-3deg); }
      50% { transform: scale(1.1) rotate(0deg); }
      75% { transform: scale(1.05) rotate(3deg); }
    }
    
    .logo {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .milestone-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .milestone-subtitle {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 300;
    }
    
    .content {
      padding: 40px 30px;
      background: #ffffff;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    
    .celebration-text {
      font-size: 18px;
      color: #4b5563;
      margin-bottom: 30px;
      line-height: 1.7;
      text-align: center;
      font-weight: 500;
    }
    
    .milestone-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 20px;
      padding: 40px;
      margin: 30px 0;
      border: 1px solid #e2e8f0;
      position: relative;
      overflow: hidden;
    }
    
    .milestone-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${info.gradient};
    }
    
    .milestone-description {
      background: white;
      padding: 25px;
      border-radius: 16px;
      margin: 30px 0;
      border: 1px solid #e5e7eb;
      border-left: 4px solid ${info.color};
    }
    
    .milestone-icon-large {
      width: 64px;
      height: 64px;
      background: ${info.gradient};
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 28px;
      color: white;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    
    .milestone-message {
      font-size: 16px;
      color: #1f2937;
      line-height: 1.6;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .achievement-details {
      background: linear-gradient(135deg, 
        ${milestone.type === 'competency_mastery' ? '#d1fae5' : '#fef3c7'} 0%, 
        ${milestone.type === 'competency_mastery' ? '#a7f3d0' : '#fde68a'} 100%
      );
      border: 1px solid ${milestone.type === 'competency_mastery' ? '#10b981' : '#f59e0b'};
      border-radius: 16px;
      padding: 24px;
      margin: 30px 0;
      text-align: center;
    }
    
    .detail-title {
      font-size: 18px;
      font-weight: 700;
      color: ${milestone.type === 'competency_mastery' ? '#065f46' : '#92400e'};
      margin-bottom: 12px;
    }
    
    .detail-text {
      color: ${milestone.type === 'competency_mastery' ? '#047857' : '#b45309'};
      font-size: 15px;
      line-height: 1.5;
    }
    
    .progress-highlight {
      display: inline-block;
      background: ${info.gradient};
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin: 0 4px;
    }
    
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: ${info.gradient};
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 10px 25px rgba(168, 85, 247, 0.3);
      transition: all 0.3s ease;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(168, 85, 247, 0.4);
    }
    
    .encouragement-section {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      padding: 25px;
      border-radius: 12px;
      margin: 30px 0;
      border-left: 4px solid #a855f7;
      text-align: center;
    }
    
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #f3f4f6;
    }
    
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
    }
    
    .footer-divider {
      width: 60px;
      height: 2px;
      background: ${info.gradient};
      margin: 0 auto 20px;
      border-radius: 1px;
    }
    
    @media (max-width: 600px) {
      .email-container {
        margin: 0 10px;
        border-radius: 16px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .milestone-card {
        padding: 30px 20px;
      }
      
      .achievement-icon {
        width: 80px;
        height: 80px;
        font-size: 36px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-content">
        <div class="achievement-icon">${info.icon}</div>
        <div class="logo">Public Prep</div>
        <div class="milestone-title">${info.title}</div>
        <div class="milestone-subtitle">Congratulations on your achievement!</div>
      </div>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${firstName}! 👋</div>
      
      <div class="celebration-text">
        <strong>Congratulations!</strong> You've achieved a new milestone: <strong>${milestone.description}</strong>
      </div>
      
      <div class="milestone-card">
        <div class="milestone-icon-large">${info.icon}</div>
        <div class="milestone-message">
          ${info.message}
        </div>
      </div>
      
      ${milestone.type === 'score_improvement' ? `
      <div class="achievement-details">
        <div class="detail-title">📈 Score Improvement Details</div>
        <div class="detail-text">
          Your interview scores have improved from 
          <span class="progress-highlight">${milestone.oldScore}%</span> 
          to 
          <span class="progress-highlight">${milestone.newScore}%</span>
          - that's excellent progress!
        </div>
      </div>
      ` : ''}
      
      ${milestone.type === 'competency_mastery' ? `
      <div class="achievement-details">
        <div class="detail-title">🏆 Competency Mastery</div>
        <div class="detail-text">
          You've achieved mastery in the 
          <span class="progress-highlight">${milestone.competency}</span> 
          competency! Your consistent high scores demonstrate real interview readiness.
        </div>
      </div>
      ` : ''}
      
      <div class="cta-section">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/app" class="cta-button">
          View Your Progress Dashboard
        </a>
      </div>
      
      <div class="encouragement-section">
        <p><strong>Keep up the excellent work!</strong></p>
        <p>Every milestone brings you closer to interview success. Your detailed progress dashboard shows your complete improvement journey and areas for continued growth.</p>
      </div>
      
      <div class="signature">
        <p><strong>You're on the path to interview excellence!</strong></p>
        <p>Best regards,<br>
        <strong>The Public Prep Team</strong></p>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-divider"></div>
      <p>Continue building your interview confidence</p>
      <p>© 2025 Public Prep - Ireland's #1 Public Service Interview Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}