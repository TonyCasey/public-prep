"""Authentication service implementation.

Handles user registration, login, logout, and password management.
"""

import logging
import re
import secrets
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.interfaces.auth_service import IAuthService
from src.domain.entities import User
from src.domain.interfaces import IUserRepository
from src.domain.value_objects import SubscriptionStatus
from src.infrastructure.database.models import PasswordResetToken
from src.infrastructure.services.password_service import hash_password, verify_password
from src.infrastructure.services.session_service import SessionService

logger = logging.getLogger(__name__)


class AuthService(IAuthService):
    """Authentication service implementation.

    Provides user authentication, registration, and password management.
    """

    # Password reset token validity
    RESET_TOKEN_EXPIRY_HOURS = 1

    def __init__(
        self,
        user_repository: IUserRepository,
        session_service: SessionService,
        db_session: AsyncSession,
    ) -> None:
        """Initialize auth service.

        Args:
            user_repository: User repository for data access
            session_service: Session management service
            db_session: Database session for password reset tokens
        """
        self._user_repo = user_repository
        self._session_service = session_service
        self._db_session = db_session

    def _validate_email(self, email: str) -> bool:
        """Validate email format.

        Args:
            email: Email address to validate

        Returns:
            True if valid, False otherwise
        """
        pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
        return bool(re.match(pattern, email))

    async def register(
        self,
        email: str,
        password: str,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> tuple[User, str, datetime]:
        """Register a new user.

        Args:
            email: User's email address
            password: Plain text password
            first_name: User's first name
            last_name: User's last name

        Returns:
            Tuple of (user, session_id, session_expiry)

        Raises:
            ValueError: If validation fails or email exists
        """
        # Validate email format
        if not self._validate_email(email):
            raise ValueError("Invalid email format")

        # Validate password length
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long")

        # Check if email already exists
        if await self._user_repo.email_exists(email):
            raise ValueError("An account with this email already exists")

        # Create user entity
        user = User(
            id=str(uuid4()),
            email=email,
            password=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            subscription_status=SubscriptionStatus.FREE,
            free_answers_used=0,
            starter_interviews_used=0,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        # Save user
        created_user = await self._user_repo.create(user)
        logger.info(f"User registered: {email}")

        # Create session
        session_id, expiry = await self._session_service.create_session(created_user.id)

        # TODO: Send welcome email asynchronously
        # TODO: Create CRM contact asynchronously

        return created_user, session_id, expiry

    async def login(
        self,
        email: str,
        password: str,
        remember_me: bool = False,
    ) -> tuple[User, str, datetime]:
        """Authenticate a user and create a session.

        Args:
            email: User's email address
            password: Plain text password
            remember_me: Whether to extend session lifetime

        Returns:
            Tuple of (user, session_id, session_expiry)

        Raises:
            ValueError: If credentials are invalid
        """
        # Get user by email
        user = await self._user_repo.get_by_email(email)

        if user is None:
            logger.warning(f"Login attempt for non-existent email: {email}")
            raise ValueError("Invalid email or password")

        # Verify password
        if not verify_password(password, user.password):
            logger.warning(f"Invalid password for user: {email}")
            raise ValueError("Invalid email or password")

        # Create session
        session_id, expiry = await self._session_service.create_session(
            user.id, remember_me=remember_me
        )

        logger.info(f"User logged in: {email} (remember_me={remember_me})")
        return user, session_id, expiry

    async def logout(self, session_id: str) -> bool:
        """End a user session.

        Args:
            session_id: Session identifier to invalidate

        Returns:
            True if session was ended, False if not found
        """
        result = await self._session_service.delete_session(session_id)
        if result:
            logger.info(f"Session ended: {session_id[:8]}...")
        return result

    async def get_current_user(self, session_id: str) -> User | None:
        """Get the currently authenticated user.

        Args:
            session_id: Session identifier

        Returns:
            User if session is valid, None otherwise
        """
        user_id = await self._session_service.get_user_id_from_session(session_id)
        if user_id is None:
            return None

        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            logger.warning(f"Session references non-existent user: {user_id}")
            # Clean up orphaned session
            await self._session_service.delete_session(session_id)
            return None

        return user

    async def request_password_reset(self, email: str) -> bool:
        """Request a password reset.

        Args:
            email: User's email address

        Returns:
            True always (to prevent email enumeration)
        """
        # Check if user exists
        user = await self._user_repo.get_by_email(email)
        if user is None:
            # Don't reveal if email exists
            logger.info(f"Password reset requested for non-existent email: {email}")
            return True

        # Generate reset token
        token = secrets.token_hex(32)  # 64 character token
        expires_at = datetime.now(UTC) + timedelta(hours=self.RESET_TOKEN_EXPIRY_HOURS)

        # Save token to database
        reset_token = PasswordResetToken(
            token=token,
            email=email,
            expires_at=expires_at,
            used=False,
            created_at=datetime.now(UTC),
        )
        self._db_session.add(reset_token)
        await self._db_session.flush()

        logger.info(f"Password reset token generated for: {email}")

        # TODO: Send password reset email
        # await send_password_reset_email(email, token, user.first_name)

        return True

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using a token.

        Args:
            token: Password reset token
            new_password: New plain text password

        Returns:
            True if password was reset

        Raises:
            ValueError: If token is invalid or expired
        """
        # Validate password
        if len(new_password) < 6:
            raise ValueError("Password must be at least 6 characters")

        # Find valid token
        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token == token,
            PasswordResetToken.used == False,  # noqa: E712
            PasswordResetToken.expires_at > datetime.now(UTC),
        )
        result = await self._db_session.execute(stmt)
        reset_token = result.scalar_one_or_none()

        if reset_token is None:
            raise ValueError("Invalid or expired reset token")

        # Get user by email
        user = await self._user_repo.get_by_email(reset_token.email)
        if user is None:
            raise ValueError("User not found")

        # Update password
        user.password = hash_password(new_password)
        user.updated_at = datetime.now(UTC)
        await self._user_repo.update(user)

        # Mark token as used
        reset_token.used = True
        reset_token.used_at = datetime.now(UTC)
        await self._db_session.flush()

        logger.info(f"Password reset completed for: {reset_token.email}")
        return True
