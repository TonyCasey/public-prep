"""Authentication API routes.

Provides endpoints for user registration, login, logout, and password management.
Matches the TypeScript backend API for frontend compatibility.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import DbSession
from src.application.dto.auth import (
    ErrorResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    SessionDebugResponse,
    UserResponse,
)
from src.application.services.auth_service import AuthService
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.services.session_service import SessionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["auth"])

# Session cookie name (matches connect-pg-simple default)
SESSION_COOKIE_NAME = "connect.sid"


def get_auth_service(db: DbSession) -> AuthService:
    """Create auth service with dependencies.

    Args:
        db: Database session from DI

    Returns:
        Configured AuthService instance
    """
    user_repo = UserRepository(db)
    session_service = SessionService(db)
    return AuthService(user_repo, session_service, db)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


def get_session_id(
    request: Request,
    connect_sid: str | None = Cookie(None, alias="connect.sid"),
) -> str | None:
    """Extract session ID from cookie.

    Args:
        request: FastAPI request
        connect_sid: Session cookie value

    Returns:
        Session ID or None
    """
    return connect_sid


SessionIdDep = Annotated[str | None, Depends(get_session_id)]


def set_session_cookie(response: Response, session_id: str, max_age_seconds: int) -> None:
    """Set session cookie on response.

    Args:
        response: FastAPI response
        session_id: Session identifier
        max_age_seconds: Cookie lifetime in seconds
    """
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        max_age=max_age_seconds,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        409: {"model": ErrorResponse, "description": "Email already exists"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
)
async def register(
    request: RegisterRequest,
    response: Response,
    auth_service: AuthServiceDep,
) -> UserResponse:
    """Register a new user account.

    Creates a new user with the provided credentials and automatically
    logs them in by creating a session.
    """
    try:
        user, session_id, expiry = await auth_service.register(
            email=request.email,
            password=request.password,
            first_name=request.first_name,
            last_name=request.last_name,
        )

        # Set session cookie
        max_age = int((expiry - expiry.utcnow().replace(tzinfo=expiry.tzinfo)).total_seconds())
        set_session_cookie(response, session_id, max_age)

        return UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            profile_image_url=user.profile_image_url,
            stripe_customer_id=user.stripe_customer_id,
            subscription_status=user.subscription_status.value,
            subscription_id=user.subscription_id,
            free_answers_used=user.free_answers_used,
            starter_interviews_used=user.starter_interviews_used,
            starter_expires_at=user.starter_expires_at,
            created_at=user.created_at,
        )

    except ValueError as e:
        error_msg = str(e)
        if "already exists" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"message": error_msg},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": error_msg},
        )
    except Exception as e:
        logger.exception("Registration error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Registration failed"},
        )


@router.post(
    "/login",
    response_model=UserResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Missing credentials"},
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
)
async def login(
    request: LoginRequest,
    response: Response,
    auth_service: AuthServiceDep,
) -> UserResponse:
    """Authenticate user and create session.

    Validates credentials and returns user data with a session cookie.
    """
    try:
        user, session_id, expiry = await auth_service.login(
            email=request.username,  # Frontend sends email as 'username'
            password=request.password,
            remember_me=request.remember_me,
        )

        # Set session cookie
        from datetime import UTC, datetime

        max_age = int((expiry - datetime.now(UTC)).total_seconds())
        set_session_cookie(response, session_id, max_age)

        return UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            profile_image_url=user.profile_image_url,
            stripe_customer_id=user.stripe_customer_id,
            subscription_status=user.subscription_status.value,
            subscription_id=user.subscription_id,
            free_answers_used=user.free_answers_used,
            starter_interviews_used=user.starter_interviews_used,
            starter_expires_at=user.starter_expires_at,
            created_at=user.created_at,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": str(e)},
        )
    except Exception as e:
        logger.exception("Login error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Login failed"},
        )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
)
async def logout(
    response: Response,
    auth_service: AuthServiceDep,
    session_id: SessionIdDep,
) -> None:
    """End user session and clear cookie."""
    if session_id:
        await auth_service.logout(session_id)

    # Clear session cookie
    response.delete_cookie(SESSION_COOKIE_NAME)


@router.get(
    "/user",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
)
async def get_current_user(
    auth_service: AuthServiceDep,
    session_id: SessionIdDep,
) -> UserResponse:
    """Get the currently authenticated user.

    Returns fresh user data from the database to ensure
    subscription status is current.
    """
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Unauthorized"},
        )

    user = await auth_service.get_current_user(session_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Unauthorized"},
        )

    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        profile_image_url=user.profile_image_url,
        stripe_customer_id=user.stripe_customer_id,
        subscription_status=user.subscription_status.value,
        subscription_id=user.subscription_id,
        free_answers_used=user.free_answers_used,
        starter_interviews_used=user.starter_interviews_used,
        starter_expires_at=user.starter_expires_at,
        created_at=user.created_at,
    )


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
async def forgot_password(
    request: ForgotPasswordRequest,
    auth_service: AuthServiceDep,
) -> MessageResponse:
    """Request a password reset email.

    Always returns success to prevent email enumeration.
    """
    await auth_service.request_password_reset(request.email)
    return MessageResponse(message="If that email exists, a reset link has been sent.")


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid token or password"},
    },
)
async def reset_password(
    request: ResetPasswordRequest,
    auth_service: AuthServiceDep,
) -> MessageResponse:
    """Reset password using a valid token."""
    try:
        await auth_service.reset_password(request.token, request.new_password)
        return MessageResponse(message="Password updated successfully")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(e)},
        )


@router.get(
    "/debug/session",
    response_model=SessionDebugResponse,
)
async def debug_session(
    auth_service: AuthServiceDep,
    session_id: SessionIdDep,
) -> SessionDebugResponse:
    """Debug endpoint to check session status.

    Returns information about the current session for debugging.
    """
    user = None
    is_authenticated = False

    if session_id:
        user_entity = await auth_service.get_current_user(session_id)
        if user_entity:
            is_authenticated = True
            user = {"id": user_entity.id, "email": user_entity.email}

    return SessionDebugResponse(
        is_authenticated=is_authenticated,
        has_session=session_id is not None,
        session_id=session_id[:8] + "..." if session_id else None,
        user=user,
    )
