"""Answer DTOs (Data Transfer Objects).

Pydantic models for answer request/response validation.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AnswerCreateRequest(BaseModel):
    """Answer creation request payload."""

    interview_id: UUID = Field(..., alias="interviewId")
    question_id: UUID = Field(..., alias="questionId")
    answer_text: str = Field(..., alias="answerText")
    time_spent: int | None = Field(None, alias="timeSpent", ge=0, description="Time spent in seconds")

    model_config = ConfigDict(populate_by_name=True)


class AnswerUpdateRequest(BaseModel):
    """Answer update request payload."""

    answer_text: str | None = Field(None, alias="answerText")
    time_spent: int | None = Field(None, alias="timeSpent", ge=0)

    model_config = ConfigDict(populate_by_name=True)


class AnswerResponse(BaseModel):
    """Answer response payload."""

    id: UUID
    interview_id: UUID | None = Field(None, alias="interviewId")
    question_id: UUID | None = Field(None, alias="questionId")
    answer_text: str = Field(..., alias="answerText")
    time_spent: int | None = Field(None, alias="timeSpent")
    answered_at: datetime | None = Field(None, alias="answeredAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        by_alias=True,
    )


class AnswerWithEvaluationResponse(AnswerResponse):
    """Answer response with AI evaluation."""

    evaluation: dict | None = None


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str
