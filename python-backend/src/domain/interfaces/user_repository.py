"""User repository interface.

Defines data access operations for User entities.
"""

from abc import abstractmethod

from src.domain.entities import User
from src.domain.value_objects import SubscriptionStatus

from .repository import IRepository


class IUserRepository(IRepository[User, str]):
    """Repository interface for User entities.

    Extends base repository with user-specific query methods.
    """

    @abstractmethod
    async def get_by_email(self, email: str) -> User | None:
        """Find a user by email address.

        Args:
            email: User's email address

        Returns:
            The user if found, None otherwise
        """
        ...

    @abstractmethod
    async def get_by_stripe_customer_id(self, customer_id: str) -> User | None:
        """Find a user by Stripe customer ID.

        Args:
            customer_id: Stripe customer identifier

        Returns:
            The user if found, None otherwise
        """
        ...

    @abstractmethod
    async def get_by_subscription_status(
        self, status: SubscriptionStatus, limit: int | None = None
    ) -> list[User]:
        """Find all users with a specific subscription status.

        Args:
            status: Subscription status to filter by
            limit: Maximum number of users to return

        Returns:
            List of users with the specified status
        """
        ...

    @abstractmethod
    async def update_subscription(
        self,
        user_id: str,
        status: SubscriptionStatus,
        subscription_id: str | None = None,
    ) -> User | None:
        """Update a user's subscription status.

        Args:
            user_id: User's unique identifier
            status: New subscription status
            subscription_id: Stripe subscription ID

        Returns:
            Updated user if found, None otherwise
        """
        ...

    @abstractmethod
    async def increment_free_answers(self, user_id: str) -> User | None:
        """Increment the free answers used counter.

        Args:
            user_id: User's unique identifier

        Returns:
            Updated user if found, None otherwise
        """
        ...

    @abstractmethod
    async def increment_starter_interviews(self, user_id: str) -> User | None:
        """Increment the starter interviews used counter.

        Args:
            user_id: User's unique identifier

        Returns:
            Updated user if found, None otherwise
        """
        ...

    @abstractmethod
    async def email_exists(self, email: str) -> bool:
        """Check if an email is already registered.

        Args:
            email: Email address to check

        Returns:
            True if email exists, False otherwise
        """
        ...
