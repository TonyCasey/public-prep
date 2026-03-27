"""User API routes.

Provides endpoints for user profile management.
All endpoints require authentication and users can only access their own data.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.dependencies import DbSession
from src.api.middleware.auth import CurrentUser
from src.application.dto.user import SubscriptionResponse, UserResponse, UserUpdateRequest
from src.application.services.user_service import UserService
from src.domain.entities import User
from src.infrastructure.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])


def get_user_service(db: DbSession) -> UserService:
    """Create user service with dependencies.

    Args:
        db: Database session from DI

    Returns:
        Configured UserService instance
    """
    user_repo = UserRepository(db)
    return UserService(user_repo)


UserServiceDep = Annotated[UserService, Depends(get_user_service)]


def _user_to_response(user: User) -> UserResponse:
    """Convert User entity to UserResponse DTO.

    Args:
        user: User domain entity

    Returns:
        UserResponse DTO
    """
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
        updated_at=user.updated_at,
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Access denied"},
        404: {"description": "User not found"},
    },
)
async def get_user(
    user_id: str,
    current_user: CurrentUser,
    user_service: UserServiceDep,
) -> UserResponse:
    """Get user by ID.

    Users can only access their own data.
    """
    try:
        user = await user_service.get_user(user_id, current_user.id)
        return _user_to_response(user)

    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Access denied"},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Access denied"},
        404: {"description": "User not found"},
    },
)
async def update_user(
    user_id: str,
    request: UserUpdateRequest,
    current_user: CurrentUser,
    user_service: UserServiceDep,
) -> UserResponse:
    """Update user profile.

    Users can only update their own data.
    Only provided fields will be updated.
    """
    try:
        user = await user_service.update_user(
            user_id=user_id,
            requesting_user_id=current_user.id,
            first_name=request.first_name,
            last_name=request.last_name,
            profile_image_url=request.profile_image_url,
        )
        return _user_to_response(user)

    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Access denied"},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )


@router.get(
    "/{user_id}/subscription",
    response_model=SubscriptionResponse,
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Access denied"},
        404: {"description": "User not found"},
    },
)
async def get_user_subscription(
    user_id: str,
    current_user: CurrentUser,
    user_service: UserServiceDep,
) -> SubscriptionResponse:
    """Get user subscription status.

    Users can only access their own subscription data.
    """
    try:
        subscription_data = await user_service.get_subscription_status(
            user_id, current_user.id
        )
        return SubscriptionResponse(
            subscription_status=subscription_data["subscription_status"],
            subscription_id=subscription_data["subscription_id"],
            starter_interviews_used=subscription_data["starter_interviews_used"],
            free_answers_used=subscription_data["free_answers_used"],
            starter_expires_at=subscription_data["starter_expires_at"],
        )

    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Access denied"},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )
