"""Data Transfer Objects package.

Exports DTOs for API request/response validation.
"""

from src.application.dto.auth import (
    ErrorResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    SessionDebugResponse,
    UserResponse as AuthUserResponse,
)
from src.application.dto.user import (
    SubscriptionResponse,
    UserResponse,
    UserUpdateRequest,
)

__all__ = [
    # Auth DTOs
    "AuthUserResponse",
    "ErrorResponse",
    "ForgotPasswordRequest",
    "LoginRequest",
    "MessageResponse",
    "RegisterRequest",
    "ResetPasswordRequest",
    "SessionDebugResponse",
    # User DTOs
    "SubscriptionResponse",
    "UserResponse",
    "UserUpdateRequest",
]
