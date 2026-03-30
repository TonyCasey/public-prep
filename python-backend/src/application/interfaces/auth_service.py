"""Authentication service interface.

Defines the contract for authentication operations.
"""

from abc import ABC, abstractmethod
from datetime import datetime

from src.domain.entities import User


class IAuthService(ABC):
    """Interface for authentication service.

    Defines authentication operations including registration,
    login, logout, and password management.
    """

    @abstractmethod
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
            ValueError: If email is invalid or already exists
        """
        ...

    @abstractmethod
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
        ...

    @abstractmethod
    async def logout(self, session_id: str) -> bool:
        """End a user session.

        Args:
            session_id: Session identifier to invalidate

        Returns:
            True if session was ended, False if not found
        """
        ...

    @abstractmethod
    async def get_current_user(self, session_id: str) -> User | None:
        """Get the currently authenticated user.

        Args:
            session_id: Session identifier

        Returns:
            User if session is valid, None otherwise
        """
        ...

    @abstractmethod
    async def request_password_reset(self, email: str) -> bool:
        """Request a password reset.

        Args:
            email: User's email address

        Returns:
            True if reset was initiated (email sent)
            Always returns True to prevent email enumeration
        """
        ...

    @abstractmethod
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
        ...
