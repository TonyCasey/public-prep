"""User DTOs (Data Transfer Objects).

Pydantic models for user request/response validation.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserUpdateRequest(BaseModel):
    """User update request payload.

    All fields are optional - only provided fields will be updated.
    """

    first_name: str | None = Field(None, alias="firstName")
    last_name: str | None = Field(None, alias="lastName")
    profile_image_url: str | None = Field(None, alias="profileImageUrl")

    model_config = ConfigDict(populate_by_name=True)


class UserResponse(BaseModel):
    """User response payload (excludes sensitive data like password)."""

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
    updated_at: datetime | None = Field(None, alias="updatedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        by_alias=True,
    )


class SubscriptionResponse(BaseModel):
    """User subscription status response."""

    subscription_status: str | None = Field(None, alias="subscriptionStatus")
    subscription_id: str | None = Field(None, alias="subscriptionId")
    starter_interviews_used: int | None = Field(None, alias="starterInterviewsUsed")
    free_answers_used: int | None = Field(None, alias="freeAnswersUsed")
    starter_expires_at: datetime | None = Field(None, alias="starterExpiresAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        by_alias=True,
    )
