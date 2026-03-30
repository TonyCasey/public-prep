"""User domain entity.

Represents a user account in the system with subscription information.
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID

from src.domain.value_objects import SubscriptionStatus


@dataclass
class User:
    """User account entity.

    Attributes:
        id: Unique user identifier
        email: User's email address (unique)
        password: Hashed password
        first_name: User's first name
        last_name: User's last name
        profile_image_url: URL to profile image
        stripe_customer_id: Stripe customer ID for payments
        subscription_status: Current subscription tier
        subscription_id: Active Stripe subscription ID
        free_answers_used: Count of free tier answers used
        starter_interviews_used: Count of starter tier interviews used
        starter_expires_at: When starter subscription expires
        milestone_sent_70: Whether 70% milestone email was sent
        milestone_sent_80: Whether 80% milestone email was sent
        created_at: Account creation timestamp
        updated_at: Last update timestamp
    """

    id: str
    email: str
    password: str
    first_name: str | None = None
    last_name: str | None = None
    profile_image_url: str | None = None
    stripe_customer_id: str | None = None
    subscription_status: SubscriptionStatus = SubscriptionStatus.FREE
    subscription_id: str | None = None
    free_answers_used: int = 0
    starter_interviews_used: int = 0
    starter_expires_at: datetime | None = None
    milestone_sent_70: bool = False
    milestone_sent_80: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @property
    def full_name(self) -> str | None:
        """Get user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name

    @property
    def is_premium(self) -> bool:
        """Check if user has premium subscription."""
        return self.subscription_status == SubscriptionStatus.PREMIUM

    @property
    def is_starter(self) -> bool:
        """Check if user has starter subscription."""
        return self.subscription_status == SubscriptionStatus.STARTER

    @property
    def is_free(self) -> bool:
        """Check if user is on free tier."""
        return self.subscription_status == SubscriptionStatus.FREE

    def can_use_free_answer(self, free_limit: int = 3) -> bool:
        """Check if user can use another free answer."""
        return self.is_free and self.free_answers_used < free_limit

    def can_use_starter_interview(self, starter_limit: int = 10) -> bool:
        """Check if user can use another starter interview."""
        if not self.is_starter:
            return False
        if self.starter_expires_at and self.starter_expires_at < datetime.now(UTC):
            return False
        return self.starter_interviews_used < starter_limit
