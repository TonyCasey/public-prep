"""Email service interface.

Defines the contract for email operations.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal


@dataclass
class InterviewSessionDetails:
    """Details about a completed interview session."""

    job_title: str
    overall_score: float
    competencies_passed: int
    total_competencies: int
    duration: str
    grade: str


@dataclass
class MilestoneDetails:
    """Details about a user milestone achievement."""

    type: Literal["first_interview", "competency_mastery", "score_improvement", "consistency"]
    description: str
    competency: str | None = None
    old_score: float | None = None
    new_score: float | None = None


@dataclass
class ContactFormData:
    """Contact form submission data."""

    name: str
    email: str
    subject: str
    message: str


class EmailServiceError(Exception):
    """Exception raised when email operations fail."""

    def __init__(
        self,
        message: str,
        original_error: Exception | None = None,
    ):
        super().__init__(message)
        self.original_error = original_error


class IEmailService(ABC):
    """Interface for email operations."""

    @abstractmethod
    async def send_welcome_email(
        self,
        email: str,
        first_name: str | None = None,
    ) -> bool:
        """Send welcome email to new user.

        Args:
            email: Recipient email
            first_name: Optional first name for personalization

        Returns:
            True if sent successfully
        """
        ...

    @abstractmethod
    async def send_password_reset_email(
        self,
        email: str,
        reset_token: str,
        first_name: str | None = None,
    ) -> bool:
        """Send password reset email.

        Args:
            email: Recipient email
            reset_token: Password reset token
            first_name: Optional first name

        Returns:
            True if sent successfully
        """
        ...

    @abstractmethod
    async def send_interview_completion_email(
        self,
        email: str,
        first_name: str,
        session_details: InterviewSessionDetails,
    ) -> bool:
        """Send interview completion congratulations.

        Args:
            email: Recipient email
            first_name: User's first name
            session_details: Interview session details

        Returns:
            True if sent successfully
        """
        ...

    @abstractmethod
    async def send_payment_confirmation_email(
        self,
        email: str,
        first_name: str,
        amount: float,
        plan_type: Literal["starter", "premium"],
        currency: str = "EUR",
    ) -> bool:
        """Send payment confirmation email.

        Args:
            email: Recipient email
            first_name: User's first name
            amount: Payment amount
            plan_type: Subscription plan type
            currency: Currency code

        Returns:
            True if sent successfully
        """
        ...

    @abstractmethod
    async def send_contact_form_notification(
        self,
        contact_data: ContactFormData,
    ) -> bool:
        """Send contact form notification to support.

        Args:
            contact_data: Contact form data

        Returns:
            True if sent successfully
        """
        ...

    @abstractmethod
    async def send_contact_confirmation_email(
        self,
        email: str,
        name: str,
    ) -> bool:
        """Send confirmation to contact form submitter.

        Args:
            email: Recipient email
            name: Contact name

        Returns:
            True if sent successfully
        """
        ...

    @abstractmethod
    async def send_milestone_achievement_email(
        self,
        email: str,
        first_name: str,
        milestone: MilestoneDetails,
    ) -> bool:
        """Send milestone achievement notification.

        Args:
            email: Recipient email
            first_name: User's first name
            milestone: Milestone details

        Returns:
            True if sent successfully
        """
        ...

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Check if the service is properly configured."""
        ...
