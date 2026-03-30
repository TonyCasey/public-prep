"""User service interface.

Defines the contract for user operations.
"""

from abc import ABC, abstractmethod

from src.domain.entities import User


class IUserService(ABC):
    """Interface for user service.

    Defines user management operations.
    """

    @abstractmethod
    async def get_user(self, user_id: str, requesting_user_id: str) -> User:
        """Get a user by ID.

        Args:
            user_id: ID of the user to retrieve
            requesting_user_id: ID of the user making the request

        Returns:
            The requested user

        Raises:
            PermissionError: If requesting user doesn't have access
            ValueError: If user not found
        """
        ...

    @abstractmethod
    async def update_user(
        self,
        user_id: str,
        requesting_user_id: str,
        first_name: str | None = None,
        last_name: str | None = None,
        profile_image_url: str | None = None,
    ) -> User:
        """Update a user's profile.

        Args:
            user_id: ID of the user to update
            requesting_user_id: ID of the user making the request
            first_name: New first name (optional)
            last_name: New last name (optional)
            profile_image_url: New profile image URL (optional)

        Returns:
            The updated user

        Raises:
            PermissionError: If requesting user doesn't have access
            ValueError: If user not found
        """
        ...

    @abstractmethod
    async def get_subscription_status(
        self,
        user_id: str,
        requesting_user_id: str,
    ) -> dict:
        """Get a user's subscription status.

        Args:
            user_id: ID of the user
            requesting_user_id: ID of the user making the request

        Returns:
            Dict with subscription details

        Raises:
            PermissionError: If requesting user doesn't have access
            ValueError: If user not found
        """
        ...
