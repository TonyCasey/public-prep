"""Authentication DTOs (Data Transfer Objects).

Pydantic models for auth request/response validation.
"""

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """Registration request payload."""

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    first_name: str | None = Field(None, description="User's first name")
    last_name: str | None = Field(None, description="User's last name")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password meets requirements."""
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v


class LoginRequest(BaseModel):
    """Login request payload."""

    # Named 'username' to match passport.js convention (uses email)
    username: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")
    remember_me: bool = Field(False, alias="rememberMe", description="Extend session to 30 days")

    model_config = ConfigDict(populate_by_name=True)


class ForgotPasswordRequest(BaseModel):
    """Forgot password request payload."""

    email: EmailStr = Field(..., description="User's email address")


class ResetPasswordRequest(BaseModel):
    """Reset password request payload."""

    token: str = Field(..., description="Password reset token")
    new_password: str = Field(
        ..., min_length=6, alias="newPassword", description="New password (min 6 characters)"
    )

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password meets requirements."""
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserResponse(BaseModel):
    """User response payload (excludes sensitive data)."""

    id: str
    email: str
    first_name: str | None = Field(None, alias="firstName")
    last_name: str | None = Field(None, alias="lastName")
    profile_image_url: str | None = Field(None, alias="profileImageUrl")
    stripe_customer_id: str | None = Field(None, alias="stripeCustomerId")
    subscription_status: str | None = Field(None, alias="subscriptionStatus")
    subscription_id: str | None = Field(None, alias="subscriptionId")
    free_answers_used: int | None = Field(None, alias="freeAnswersUsed")
    starter_interviews_used: int | None = Field(None, alias="starterInterviewsUsed")
    starter_expires_at: datetime | None = Field(None, alias="starterExpiresAt")
    created_at: datetime | None = Field(None, alias="createdAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        # Serialize using alias names (camelCase for JS frontend)
        by_alias=True,
    )


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


class ErrorResponse(BaseModel):
    """Error response with optional details."""

    message: str
    details: dict | None = None


class SessionDebugResponse(BaseModel):
    """Debug response for session info."""

    is_authenticated: bool = Field(..., alias="isAuthenticated")
    has_session: bool = Field(..., alias="hasSession")
    session_id: str | None = Field(None, alias="sessionId")
    user: dict | None = None

    model_config = ConfigDict(populate_by_name=True, by_alias=True)
