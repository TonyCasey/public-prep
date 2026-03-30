"""Question DTOs (Data Transfer Objects).

Pydantic models for question request/response validation.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class QuestionCreateRequest(BaseModel):
    """Question creation request payload."""

    interview_id: UUID = Field(..., alias="interviewId")
    competency: str
    question_text: str = Field(..., alias="questionText")
    difficulty: str = Field("intermediate", description="beginner, intermediate, or advanced")

    model_config = ConfigDict(populate_by_name=True)


class QuestionResponse(BaseModel):
    """Question response payload."""

    id: UUID
    user_id: str | None = Field(None, alias="userId")
    interview_id: UUID | None = Field(None, alias="interviewId")
    competency: str
    question_text: str = Field(..., alias="questionText")
    difficulty: str
    generated_at: datetime | None = Field(None, alias="generatedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        by_alias=True,
    )


class QuestionListResponse(BaseModel):
    """Response containing list of questions."""

    questions: list[QuestionResponse]
    count: int


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str
