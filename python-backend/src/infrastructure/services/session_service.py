"""Session service for managing user sessions.

Compatible with connect-pg-simple session store used by the TypeScript backend.
Sessions are stored in the 'sessions' table with JSONB data.
"""

import json
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.database.models import Session as SessionModel


class SessionService:
    """Service for managing user sessions in PostgreSQL.

    Works with the existing sessions table created by connect-pg-simple.
    """

    # Session cookie settings
    DEFAULT_MAX_AGE = 7 * 24 * 60 * 60 * 1000  # 7 days in milliseconds
    REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60 * 1000  # 30 days in milliseconds

    def __init__(self, db_session: AsyncSession) -> None:
        """Initialize session service.

        Args:
            db_session: SQLAlchemy async session
        """
        self._session = db_session

    def _generate_session_id(self) -> str:
        """Generate a cryptographically secure session ID.

        Returns:
            32-character hex string session ID
        """
        return secrets.token_hex(16)

    async def create_session(
        self,
        user_id: str,
        remember_me: bool = False,
    ) -> tuple[str, datetime]:
        """Create a new session for a user.

        Args:
            user_id: User's unique identifier
            remember_me: Whether to extend session lifetime

        Returns:
            Tuple of (session_id, expiry_datetime)
        """
        session_id = self._generate_session_id()
        max_age_ms = self.REMEMBER_ME_MAX_AGE if remember_me else self.DEFAULT_MAX_AGE
        max_age_seconds = max_age_ms / 1000

        expire = datetime.now(UTC) + timedelta(seconds=max_age_seconds)

        # Session data format matching connect-pg-simple
        sess_data = {
            "cookie": {
                "originalMaxAge": max_age_ms,
                "expires": expire.isoformat(),
                "secure": False,
                "httpOnly": True,
                "sameSite": "lax",
            },
            "passport": {"user": user_id},
        }

        session = SessionModel(
            sid=session_id,
            sess=sess_data,
            expire=expire,
        )

        self._session.add(session)
        await self._session.flush()

        return session_id, expire

    async def get_session(self, session_id: str) -> dict[str, Any] | None:
        """Get session data by session ID.

        Args:
            session_id: Session identifier

        Returns:
            Session data if found and not expired, None otherwise
        """
        stmt = select(SessionModel).where(
            SessionModel.sid == session_id,
            SessionModel.expire > datetime.now(UTC),
        )
        result = await self._session.execute(stmt)
        session = result.scalar_one_or_none()

        if session is None:
            return None

        return session.sess

    async def get_user_id_from_session(self, session_id: str) -> str | None:
        """Get user ID from a session.

        Args:
            session_id: Session identifier

        Returns:
            User ID if session is valid, None otherwise
        """
        sess_data = await self.get_session(session_id)
        if sess_data is None:
            return None

        try:
            return sess_data.get("passport", {}).get("user")
        except (KeyError, TypeError):
            return None

    async def update_session_expiry(
        self,
        session_id: str,
        remember_me: bool = False,
    ) -> datetime | None:
        """Update session expiry time.

        Args:
            session_id: Session identifier
            remember_me: Whether to use extended lifetime

        Returns:
            New expiry datetime if session exists, None otherwise
        """
        max_age_ms = self.REMEMBER_ME_MAX_AGE if remember_me else self.DEFAULT_MAX_AGE
        max_age_seconds = max_age_ms / 1000
        new_expire = datetime.now(UTC) + timedelta(seconds=max_age_seconds)

        stmt = select(SessionModel).where(SessionModel.sid == session_id)
        result = await self._session.execute(stmt)
        session = result.scalar_one_or_none()

        if session is None:
            return None

        # Update session data with new expiry
        sess_data = session.sess.copy()
        sess_data["cookie"]["originalMaxAge"] = max_age_ms
        sess_data["cookie"]["expires"] = new_expire.isoformat()

        session.sess = sess_data
        session.expire = new_expire

        await self._session.flush()
        return new_expire

    async def delete_session(self, session_id: str) -> bool:
        """Delete a session (logout).

        Args:
            session_id: Session identifier

        Returns:
            True if session was deleted, False if not found
        """
        stmt = delete(SessionModel).where(SessionModel.sid == session_id)
        result = await self._session.execute(stmt)
        await self._session.flush()

        return result.rowcount > 0

    async def delete_user_sessions(self, user_id: str) -> int:
        """Delete all sessions for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            Number of sessions deleted
        """
        # We need to find sessions where passport.user matches
        # This is trickier with JSONB, using a raw query
        stmt = select(SessionModel).where(
            SessionModel.sess["passport"]["user"].astext == user_id
        )
        result = await self._session.execute(stmt)
        sessions = result.scalars().all()

        count = 0
        for session in sessions:
            await self._session.delete(session)
            count += 1

        await self._session.flush()
        return count

    async def cleanup_expired_sessions(self) -> int:
        """Remove all expired sessions.

        Returns:
            Number of sessions deleted
        """
        stmt = delete(SessionModel).where(SessionModel.expire < datetime.now(UTC))
        result = await self._session.execute(stmt)
        await self._session.flush()

        return result.rowcount
