"""Unit tests for AuthService.

Tests authentication business logic with mocked dependencies.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from src.application.services.auth_service import AuthService
from src.domain.entities import User
from src.domain.value_objects import SubscriptionStatus


@pytest.fixture
def mock_user_repository() -> AsyncMock:
    """Create a mock user repository."""
    repo = AsyncMock()
    repo.email_exists = AsyncMock(return_value=False)
    repo.get_by_email = AsyncMock(return_value=None)
    repo.get_by_id = AsyncMock(return_value=None)
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    return repo


@pytest.fixture
def mock_session_service() -> AsyncMock:
    """Create a mock session service."""
    service = AsyncMock()
    service.create_session = AsyncMock(
        return_value=("test-session-id", datetime.now(UTC) + timedelta(days=7))
    )
    service.delete_session = AsyncMock(return_value=True)
    service.get_user_id_from_session = AsyncMock(return_value=None)
    return service


@pytest.fixture
def mock_db_session() -> AsyncMock:
    """Create a mock database session."""
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.execute = AsyncMock()
    return session


@pytest.fixture
def auth_service(
    mock_user_repository: AsyncMock,
    mock_session_service: AsyncMock,
    mock_db_session: AsyncMock,
) -> AuthService:
    """Create auth service with mocked dependencies."""
    return AuthService(mock_user_repository, mock_session_service, mock_db_session)


@pytest.fixture
def sample_user() -> User:
    """Create a sample user for testing."""
    return User(
        id=str(uuid4()),
        email="test@example.com",
        password="hashedpassword.salt",
        first_name="Test",
        last_name="User",
        subscription_status=SubscriptionStatus.FREE,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


class TestRegister:
    """Tests for AuthService.register method."""

    @pytest.mark.asyncio
    async def test_successful_registration(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_session_service: AsyncMock,
    ) -> None:
        """Should register user and create session."""
        # Arrange
        mock_user_repository.email_exists.return_value = False
        mock_user_repository.create.return_value = User(
            id="user-123",
            email="new@example.com",
            password="hashed",
            subscription_status=SubscriptionStatus.FREE,
        )

        # Act
        user, session_id, expiry = await auth_service.register(
            email="new@example.com",
            password="password123",
            first_name="New",
            last_name="User",
        )

        # Assert
        assert user.email == "new@example.com"
        assert session_id == "test-session-id"
        mock_user_repository.email_exists.assert_called_once_with("new@example.com")
        mock_user_repository.create.assert_called_once()
        mock_session_service.create_session.assert_called_once()

    @pytest.mark.asyncio
    async def test_registration_with_existing_email(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ) -> None:
        """Should raise error if email already exists."""
        mock_user_repository.email_exists.return_value = True

        with pytest.raises(ValueError, match="already exists"):
            await auth_service.register(
                email="existing@example.com",
                password="password123",
            )

    @pytest.mark.asyncio
    async def test_registration_with_invalid_email(
        self,
        auth_service: AuthService,
    ) -> None:
        """Should raise error for invalid email format."""
        with pytest.raises(ValueError, match="Invalid email"):
            await auth_service.register(
                email="invalid-email",
                password="password123",
            )

    @pytest.mark.asyncio
    async def test_registration_with_short_password(
        self,
        auth_service: AuthService,
    ) -> None:
        """Should raise error for password less than 6 characters."""
        with pytest.raises(ValueError, match="at least 6 characters"):
            await auth_service.register(
                email="test@example.com",
                password="12345",
            )


class TestLogin:
    """Tests for AuthService.login method."""

    @pytest.mark.asyncio
    async def test_successful_login(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_session_service: AsyncMock,
        sample_user: User,
    ) -> None:
        """Should authenticate user and create session."""
        # Arrange
        mock_user_repository.get_by_email.return_value = sample_user

        with patch(
            "src.application.services.auth_service.verify_password",
            return_value=True,
        ):
            # Act
            user, session_id, expiry = await auth_service.login(
                email="test@example.com",
                password="correctpassword",
            )

        # Assert
        assert user.email == "test@example.com"
        assert session_id == "test-session-id"
        mock_session_service.create_session.assert_called_once_with(
            sample_user.id, remember_me=False
        )

    @pytest.mark.asyncio
    async def test_login_with_remember_me(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_session_service: AsyncMock,
        sample_user: User,
    ) -> None:
        """Should create extended session with remember_me."""
        mock_user_repository.get_by_email.return_value = sample_user

        with patch(
            "src.application.services.auth_service.verify_password",
            return_value=True,
        ):
            await auth_service.login(
                email="test@example.com",
                password="correctpassword",
                remember_me=True,
            )

        mock_session_service.create_session.assert_called_once_with(
            sample_user.id, remember_me=True
        )

    @pytest.mark.asyncio
    async def test_login_with_nonexistent_email(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ) -> None:
        """Should raise error for non-existent email."""
        mock_user_repository.get_by_email.return_value = None

        with pytest.raises(ValueError, match="Invalid email or password"):
            await auth_service.login(
                email="nonexistent@example.com",
                password="password",
            )

    @pytest.mark.asyncio
    async def test_login_with_wrong_password(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        sample_user: User,
    ) -> None:
        """Should raise error for incorrect password."""
        mock_user_repository.get_by_email.return_value = sample_user

        with patch(
            "src.application.services.auth_service.verify_password",
            return_value=False,
        ):
            with pytest.raises(ValueError, match="Invalid email or password"):
                await auth_service.login(
                    email="test@example.com",
                    password="wrongpassword",
                )


class TestLogout:
    """Tests for AuthService.logout method."""

    @pytest.mark.asyncio
    async def test_successful_logout(
        self,
        auth_service: AuthService,
        mock_session_service: AsyncMock,
    ) -> None:
        """Should delete session on logout."""
        mock_session_service.delete_session.return_value = True

        result = await auth_service.logout("session-123")

        assert result is True
        mock_session_service.delete_session.assert_called_once_with("session-123")

    @pytest.mark.asyncio
    async def test_logout_nonexistent_session(
        self,
        auth_service: AuthService,
        mock_session_service: AsyncMock,
    ) -> None:
        """Should return False for non-existent session."""
        mock_session_service.delete_session.return_value = False

        result = await auth_service.logout("nonexistent")

        assert result is False


class TestGetCurrentUser:
    """Tests for AuthService.get_current_user method."""

    @pytest.mark.asyncio
    async def test_returns_user_for_valid_session(
        self,
        auth_service: AuthService,
        mock_session_service: AsyncMock,
        mock_user_repository: AsyncMock,
        sample_user: User,
    ) -> None:
        """Should return user for valid session."""
        mock_session_service.get_user_id_from_session.return_value = sample_user.id
        mock_user_repository.get_by_id.return_value = sample_user

        user = await auth_service.get_current_user("valid-session")

        assert user is not None
        assert user.email == sample_user.email

    @pytest.mark.asyncio
    async def test_returns_none_for_invalid_session(
        self,
        auth_service: AuthService,
        mock_session_service: AsyncMock,
    ) -> None:
        """Should return None for invalid session."""
        mock_session_service.get_user_id_from_session.return_value = None

        user = await auth_service.get_current_user("invalid-session")

        assert user is None

    @pytest.mark.asyncio
    async def test_returns_none_and_cleans_orphaned_session(
        self,
        auth_service: AuthService,
        mock_session_service: AsyncMock,
        mock_user_repository: AsyncMock,
    ) -> None:
        """Should clean up session if user doesn't exist."""
        mock_session_service.get_user_id_from_session.return_value = "deleted-user-id"
        mock_user_repository.get_by_id.return_value = None

        user = await auth_service.get_current_user("orphaned-session")

        assert user is None
        mock_session_service.delete_session.assert_called_once_with("orphaned-session")


class TestPasswordReset:
    """Tests for password reset functionality."""

    @pytest.mark.asyncio
    async def test_request_reset_for_existing_user(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_db_session: AsyncMock,
        sample_user: User,
    ) -> None:
        """Should create reset token for existing user."""
        mock_user_repository.get_by_email.return_value = sample_user

        result = await auth_service.request_password_reset("test@example.com")

        assert result is True
        mock_db_session.add.assert_called_once()
        mock_db_session.flush.assert_called_once()

    @pytest.mark.asyncio
    async def test_request_reset_for_nonexistent_user(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ) -> None:
        """Should return True even for non-existent user (prevent enumeration)."""
        mock_user_repository.get_by_email.return_value = None

        result = await auth_service.request_password_reset("nonexistent@example.com")

        # Should still return True to prevent email enumeration
        assert result is True

    @pytest.mark.asyncio
    async def test_reset_password_with_short_password(
        self,
        auth_service: AuthService,
    ) -> None:
        """Should raise error for password less than 6 characters."""
        with pytest.raises(ValueError, match="at least 6 characters"):
            await auth_service.reset_password("valid-token", "12345")
