"""Authentication middleware and dependencies.

Provides reusable authentication dependencies for FastAPI routes.
"""

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import DbSession
from src.domain.entities import User
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.services.session_service import SessionService

# Session cookie name (matches connect-pg-simple default)
SESSION_COOKIE_NAME = "connect.sid"


async def get_session_id(
    connect_sid: str | None = Cookie(None, alias="connect.sid"),
) -> str | None:
    """Extract session ID from cookie.

    Args:
        connect_sid: Session cookie value

    Returns:
        Session ID or None
    """
    return connect_sid


SessionIdDep = Annotated[str | None, Depends(get_session_id)]


async def get_current_user(
    db: DbSession,
    session_id: SessionIdDep,
) -> User:
    """Get the current authenticated user.

    This is a FastAPI dependency that can be used to protect routes.
    Raises 401 if not authenticated.

    Args:
        db: Database session
        session_id: Session ID from cookie

    Returns:
        The authenticated user

    Raises:
        HTTPException: 401 if not authenticated
    """
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Unauthorized"},
        )

    session_service = SessionService(db)
    user_id = await session_service.get_user_id_from_session(session_id)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Unauthorized"},
        )

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if not user:
        # Session references non-existent user - clean up
        await session_service.delete_session(session_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Unauthorized"},
        )

    return user


# Type alias for cleaner route signatures
CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_optional_user(
    db: DbSession,
    session_id: SessionIdDep,
) -> User | None:
    """Get the current user if authenticated, None otherwise.

    This is a FastAPI dependency for routes that work with or without auth.

    Args:
        db: Database session
        session_id: Session ID from cookie

    Returns:
        The authenticated user or None
    """
    if not session_id:
        return None

    session_service = SessionService(db)
    user_id = await session_service.get_user_id_from_session(session_id)

    if not user_id:
        return None

    user_repo = UserRepository(db)
    return await user_repo.get_by_id(user_id)


OptionalUser = Annotated[User | None, Depends(get_optional_user)]
