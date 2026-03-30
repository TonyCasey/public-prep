"""Unit tests for UserService.

Tests user management business logic with mocked dependencies.
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.services.user_service import UserService
from src.domain.entities import User
from src.domain.value_objects import SubscriptionStatus


@pytest.fixture
def mock_user_repository() -> AsyncMock:
    """Create a mock user repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.update = AsyncMock()
    return repo


@pytest.fixture
def user_service(mock_user_repository: AsyncMock) -> UserService:
    """Create user service with mocked dependencies."""
    return UserService(mock_user_repository)


@pytest.fixture
def sample_user() -> User:
    """Create a sample user for testing."""
    return User(
        id="user-123",
        email="test@example.com",
        password="hashedpassword.salt",
        first_name="Test",
        last_name="User",
        profile_image_url="https://example.com/avatar.jpg",
        subscription_status=SubscriptionStatus.FREE,
        free_answers_used=5,
        starter_interviews_used=0,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


class TestGetUser:
    """Tests for UserService.get_user method."""

    @pytest.mark.asyncio
    async def test_returns_user_when_accessing_own_data(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock,
        sample_user: User,
    ) -> None:
        """Should return user when accessing own data."""
        mock_user_repository.get_by_id.return_value = sample_user

        user = await user_service.get_user("user-123", "user-123")

        assert user.id == "user-123"
        assert user.email == "test@example.com"
        mock_user_repository.get_by_id.assert_called_once_with("user-123")

    @pytest.mark.asyncio
    async def test_raises_permission_error_when_accessing_other_user(
        self,
        user_service: UserService,
    ) -> None:
        """Should raise PermissionError when accessing another user's data."""
        with pytest.raises(PermissionError, match="Access denied"):
            await user_service.get_user("user-123", "different-user")

    @pytest.mark.asyncio
    async def test_raises_value_error_when_user_not_found(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when user doesn't exist."""
        mock_user_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="User not found"):
            await user_service.get_user("nonexistent", "nonexistent")


class TestUpdateUser:
    """Tests for UserService.update_user method."""

    @pytest.mark.asyncio
    async def test_updates_user_successfully(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock,
        sample_user: User,
    ) -> None:
        """Should update user fields when authorized."""
        mock_user_repository.get_by_id.return_value = sample_user
        mock_user_repository.update.return_value = sample_user

        user = await user_service.update_user(
            user_id="user-123",
            requesting_user_id="user-123",
            first_name="NewFirst",
            last_name="NewLast",
        )

        assert user is not None
        mock_user_repository.update.assert_called_once()
        # Check that the user entity was updated
        updated_user = mock_user_repository.update.call_args[0][0]
        assert updated_user.first_name == "NewFirst"
        assert updated_user.last_name == "NewLast"

    @pytest.mark.asyncio
    async def test_only_updates_provided_fields(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock,
        sample_user: User,
    ) -> None:
        """Should only update fields that are provided."""
        original_last_name = sample_user.last_name
        mock_user_repository.get_by_id.return_value = sample_user
        mock_user_repository.update.return_value = sample_user

        await user_service.update_user(
            user_id="user-123",
            requesting_user_id="user-123",
            first_name="NewFirst",
            # last_name not provided
        )

        updated_user = mock_user_repository.update.call_args[0][0]
        assert updated_user.first_name == "NewFirst"
        assert updated_user.last_name == original_last_name  # Unchanged

    @pytest.mark.asyncio
    async def test_raises_permission_error_when_updating_other_user(
        self,
        user_service: UserService,
    ) -> None:
        """Should raise PermissionError when updating another user."""
        with pytest.raises(PermissionError, match="Access denied"):
            await user_service.update_user(
                user_id="user-123",
                requesting_user_id="different-user",
                first_name="Hacker",
            )

    @pytest.mark.asyncio
    async def test_raises_value_error_when_user_not_found(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when user doesn't exist."""
        mock_user_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="User not found"):
            await user_service.update_user(
                user_id="nonexistent",
                requesting_user_id="nonexistent",
                first_name="Test",
            )


class TestGetSubscriptionStatus:
    """Tests for UserService.get_subscription_status method."""

    @pytest.mark.asyncio
    async def test_returns_subscription_data(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock,
        sample_user: User,
    ) -> None:
        """Should return subscription data when authorized."""
        mock_user_repository.get_by_id.return_value = sample_user

        result = await user_service.get_subscription_status("user-123", "user-123")

        assert result["subscription_status"] == "free"
        assert result["free_answers_used"] == 5
        assert result["starter_interviews_used"] == 0

    @pytest.mark.asyncio
    async def test_raises_permission_error_for_other_user(
        self,
        user_service: UserService,
    ) -> None:
        """Should raise PermissionError when accessing another user's subscription."""
        with pytest.raises(PermissionError, match="Access denied"):
            await user_service.get_subscription_status("user-123", "different-user")

    @pytest.mark.asyncio
    async def test_raises_value_error_when_user_not_found(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when user doesn't exist."""
        mock_user_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="User not found"):
            await user_service.get_subscription_status("nonexistent", "nonexistent")


class TestAccessControl:
    """Tests for access control logic."""

    @pytest.mark.asyncio
    async def test_check_access_allows_same_user(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock,
        sample_user: User,
    ) -> None:
        """Should allow access when user IDs match."""
        mock_user_repository.get_by_id.return_value = sample_user

        # Should not raise
        user = await user_service.get_user("user-123", "user-123")
        assert user is not None

    @pytest.mark.asyncio
    async def test_check_access_denies_different_user(
        self,
        user_service: UserService,
    ) -> None:
        """Should deny access when user IDs don't match."""
        with pytest.raises(PermissionError):
            await user_service.get_user("user-123", "user-456")

    @pytest.mark.asyncio
    async def test_access_check_happens_before_database_query(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock,
    ) -> None:
        """Access check should happen before database query for efficiency."""
        with pytest.raises(PermissionError):
            await user_service.get_user("user-123", "different-user")

        # Repository should not have been called
        mock_user_repository.get_by_id.assert_not_called()
