"""SendGrid email service implementation.

Provides email sending using SendGrid API.
"""

import logging
from datetime import datetime
from typing import Literal

from src.application.interfaces.email_service import (
    ContactFormData,
    EmailServiceError,
    IEmailService,
    InterviewSessionDetails,
    MilestoneDetails,
)

logger = logging.getLogger(__name__)


class SendGridEmailService(IEmailService):
    """SendGrid email service implementation."""

    def __init__(
        self,
        api_key: str | None,
        from_email: str = "noreply@publicprep.ie",
        support_email: str = "support@publicprep.ie",
        base_url: str = "http://localhost:5173",
    ) -> None:
        """Initialize SendGrid email service.

        Args:
            api_key: SendGrid API key
            from_email: Default sender email
            support_email: Support team email
            base_url: Base URL for links in emails
        """
        self._api_key = api_key
        self._from_email = from_email
        self._support_email = support_email
        self._base_url = base_url
        self._client = None

        if api_key:
            try:
                from sendgrid import SendGridAPIClient

                self._client = SendGridAPIClient(api_key)
                logger.info("SendGrid email service initialized")
            except ImportError:
                logger.warning("sendgrid package not installed")

    @property
    def is_configured(self) -> bool:
        """Check if the service is properly configured."""
        return self._client is not None and self._api_key is not None

    async def _send_email(
        self,
        to_email: str,
        subject: str,
        text_content: str,
        html_content: str | None = None,
    ) -> bool:
        """Send an email via SendGrid.

        Args:
            to_email: Recipient email
            subject: Email subject
            text_content: Plain text content
            html_content: Optional HTML content

        Returns:
            True if sent successfully
        """
        if not self.is_configured:
            logger.warning(f"Email service not configured - would send to: {to_email}")
            return False

        try:
            from sendgrid.helpers.mail import Content, Email, Mail, To

            message = Mail(
                from_email=Email(self._from_email),
                to_emails=To(to_email),
                subject=subject,
            )
            message.add_content(Content("text/plain", text_content))

            if html_content:
                message.add_content(Content("text/html", html_content))

            response = self._client.send(message)

            if response.status_code in (200, 201, 202):
                logger.info(f"Email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"Email send failed with status {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False

    async def send_welcome_email(
        self,
        email: str,
        first_name: str | None = None,
    ) -> bool:
        """Send welcome email to new user."""
        display_name = first_name or "there"

        text_content = f"""
Hi {display_name},

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
        """.strip()

        html_content = self._generate_welcome_html(display_name)

        return await self._send_email(
            to_email=email,
            subject="Welcome to Public Prep - Your Interview Success Journey Starts Now!",
            text_content=text_content,
            html_content=html_content,
        )

    async def send_password_reset_email(
        self,
        email: str,
        reset_token: str,
        first_name: str | None = None,
    ) -> bool:
        """Send password reset email."""
        display_name = first_name or "there"
        reset_url = f"{self._base_url}/reset-password?token={reset_token}"

        text_content = f"""
Hi {display_name},

You requested a password reset for your Public Prep account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour for security reasons.

If you didn't request this reset, please ignore this email.

Best regards,
The Public Prep Team
        """.strip()

        html_content = self._generate_password_reset_html(display_name, reset_url)

        return await self._send_email(
            to_email=email,
            subject="Reset Your Public Prep Password",
            text_content=text_content,
            html_content=html_content,
        )

    async def send_interview_completion_email(
        self,
        email: str,
        first_name: str,
        session_details: InterviewSessionDetails,
    ) -> bool:
        """Send interview completion congratulations."""
        passed = session_details.overall_score >= 60

        if passed:
            subject = "Congratulations! You've Completed Your Practice Interview"
        else:
            subject = "Practice Interview Complete - Keep Going, You're Improving!"

        text_content = f"""
Hi {first_name},

{'Congratulations!' if passed else 'Great effort!'} You've completed your practice interview.

Session Results:
- Job: {session_details.job_title}
- Grade: {session_details.grade}
- Overall Score: {session_details.overall_score:.0f}%
- Competencies Passed: {session_details.competencies_passed}/{session_details.total_competencies}
- Duration: {session_details.duration}

{'Keep up the great work!' if passed else 'Every practice session makes you stronger. Keep going!'}

Log in to review your detailed feedback and continue improving.

Best regards,
The Public Prep Team
        """.strip()

        return await self._send_email(
            to_email=email,
            subject=subject,
            text_content=text_content,
        )

    async def send_payment_confirmation_email(
        self,
        email: str,
        first_name: str,
        amount: float,
        plan_type: Literal["starter", "premium"],
        currency: str = "EUR",
    ) -> bool:
        """Send payment confirmation email."""
        is_starter = plan_type == "starter"
        plan_name = "Interview Confidence Starter" if is_starter else "Lifetime Premium Access"
        currency_symbol = "€" if currency == "EUR" else currency

        if is_starter:
            features = """
- 1 Full Practice Interview Session
- CV Analysis with AI Feedback
- STAR Method Coaching & Scoring
- All 6 Competency Areas Coverage
- 30 Days Access Period
            """.strip()
        else:
            features = """
- Unlimited AI interview practice
- Advanced competency analysis
- Detailed performance tracking
- Expert-level question difficulty
- Priority customer support
            """.strip()

        text_content = f"""
Hi {first_name},

Thank you for purchasing {plan_name}!

Payment Details:
- Amount: {currency_symbol}{amount:.2f}
- Plan: {plan_name}
- Date: {datetime.now().strftime('%d %B %Y')}

Your package includes:
{features}

Log in to your account to start using your features immediately.

Thank you for choosing Public Prep!

Best regards,
The Public Prep Team
        """.strip()

        return await self._send_email(
            to_email=email,
            subject=f"Payment Confirmed - Welcome to {plan_name}!",
            text_content=text_content,
        )

    async def send_contact_form_notification(
        self,
        contact_data: ContactFormData,
    ) -> bool:
        """Send contact form notification to support."""
        text_content = f"""
New Contact Form Submission

From: {contact_data.name} ({contact_data.email})
Subject: {contact_data.subject}

Message:
{contact_data.message}

---
Submitted at: {datetime.now().strftime('%d %B %Y %H:%M')}
        """.strip()

        return await self._send_email(
            to_email=self._support_email,
            subject=f"Contact Form: {contact_data.subject}",
            text_content=text_content,
        )

    async def send_contact_confirmation_email(
        self,
        email: str,
        name: str,
    ) -> bool:
        """Send confirmation to contact form submitter."""
        text_content = f"""
Hi {name},

Thank you for reaching out to Public Prep! We've received your message and will get back to you within 24 hours.

In the meantime, feel free to explore our AI-powered interview preparation platform at {self._base_url}.

Best regards,
The Public Prep Team
        """.strip()

        return await self._send_email(
            to_email=email,
            subject="Thank you for contacting Public Prep",
            text_content=text_content,
        )

    async def send_milestone_achievement_email(
        self,
        email: str,
        first_name: str,
        milestone: MilestoneDetails,
    ) -> bool:
        """Send milestone achievement notification."""
        milestone_titles = {
            "first_interview": "First Interview Complete!",
            "competency_mastery": "Competency Mastered!",
            "score_improvement": "Score Improved!",
            "consistency": "Consistent Practice Achievement!",
        }

        title = milestone_titles.get(milestone.type, "Achievement Unlocked!")

        text_content = f"""
Hi {first_name},

Congratulations on your achievement: {title}

{milestone.description}
        """

        if milestone.competency:
            text_content += f"\nCompetency: {milestone.competency}"

        if milestone.old_score is not None and milestone.new_score is not None:
            text_content += f"\nImprovement: {milestone.old_score:.0f}% → {milestone.new_score:.0f}%"

        text_content += """

Keep up the great work! Log in to continue your preparation journey.

Best regards,
The Public Prep Team
        """

        return await self._send_email(
            to_email=email,
            subject=f"Achievement: {title}",
            text_content=text_content.strip(),
        )

    def _generate_welcome_html(self, display_name: str) -> str:
        """Generate welcome email HTML content."""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #1a56db; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #f9fafb; }}
        .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
        .cta {{ display: inline-block; padding: 12px 24px; background: #1a56db; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Public Prep!</h1>
        </div>
        <div class="content">
            <p>Hi {display_name},</p>
            <p>We're excited to help you excel in your Irish Public Service interview!</p>
            <h3>Getting Started:</h3>
            <ol>
                <li>Upload your CV for AI analysis</li>
                <li>Upload the job specification</li>
                <li>Start practicing with AI-generated questions</li>
                <li>Track your progress across all competencies</li>
            </ol>
            <p><a href="{self._base_url}/app" class="cta">Start Practicing</a></p>
        </div>
        <div class="footer">
            <p>The Public Prep Team</p>
        </div>
    </div>
</body>
</html>
        """.strip()

    def _generate_password_reset_html(self, display_name: str, reset_url: str) -> str:
        """Generate password reset email HTML content."""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #1a56db; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #f9fafb; }}
        .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
        .cta {{ display: inline-block; padding: 12px 24px; background: #1a56db; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <p>Hi {display_name},</p>
            <p>You requested a password reset for your Public Prep account.</p>
            <p><a href="{reset_url}" class="cta">Reset Password</a></p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>The Public Prep Team</p>
        </div>
    </div>
</body>
</html>
        """.strip()
