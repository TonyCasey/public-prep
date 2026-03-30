"""User service implementation.

Handles user profile management and subscription queries.
"""

import logging
from datetime import UTC, datetime

from src.application.interfaces.user_service import IUserService
from src.domain.entities import User
from src.domain.interfaces import IUserRepository

logger = logging.getLogger(__name__)


class UserService(IUserService):
    """User service implementation.

    Provides user profile management with authorization checks.
    Users can only access/modify their own data.
    """

    def __init__(self, user_repository: IUserRepository) -> None:
        """Initialize user service.

        Args:
            user_repository: User repository for data access
        """
        self._user_repo = user_repository

    def _check_access(self, user_id: str, requesting_user_id: str) -> None:
        """Check if requesting user has access to the target user's data.

        Args:
            user_id: Target user ID
            requesting_user_id: Requesting user ID

        Raises:
            PermissionError: If access is denied
        """
        if user_id != requesting_user_id:
            logger.warning(
                f"Access denied: user {requesting_user_id} tried to access user {user_id}"
            )
            raise PermissionError("Access denied")

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
        self._check_access(user_id, requesting_user_id)

        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            raise ValueError("User not found")

        return user

    async def update_user(
        self,
        user_id: str,
        requesting_user_id: str,
        first_name: str | None = None,
        last_name: str | None = None,
        profile_image_url: str | None = None,
    ) -> User:
        """Update a user's profile.

        Only updates fields that are provided (not None).

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
        self._check_access(user_id, requesting_user_id)

        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            raise ValueError("User not found")

        # Update only provided fields
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if profile_image_url is not None:
            user.profile_image_url = profile_image_url

        user.updated_at = datetime.now(UTC)

        updated_user = await self._user_repo.update(user)
        logger.info(f"User updated: {user_id}")

        return updated_user

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
        self._check_access(user_id, requesting_user_id)

        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            raise ValueError("User not found")

        return {
            "subscription_status": user.subscription_status.value,
            "subscription_id": user.subscription_id,
            "starter_interviews_used": user.starter_interviews_used,
            "free_answers_used": user.free_answers_used,
            "starter_expires_at": user.starter_expires_at,
        }
