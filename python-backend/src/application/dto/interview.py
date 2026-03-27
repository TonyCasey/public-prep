"""Interview DTOs (Data Transfer Objects).

Pydantic models for interview request/response validation.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class InterviewCreateRequest(BaseModel):
    """Interview creation request payload."""

    session_type: str = Field(..., alias="sessionType", description="Type: full, competency_focus, quick")
    total_questions: int = Field(..., alias="totalQuestions", ge=1)
    competency_focus: list[str] | None = Field(None, alias="competencyFocus")
    job_title: str | None = Field(None, alias="jobTitle")
    job_grade: str = Field("eo", alias="jobGrade")
    framework: str = Field("old", description="Competency framework: old or new")

    model_config = ConfigDict(populate_by_name=True)


class InterviewUpdateRequest(BaseModel):
    """Interview update request payload.

    All fields are optional - only provided fields will be updated.
    """

    current_question_index: int | None = Field(None, alias="currentQuestionIndex", ge=0)
    completed_questions: int | None = Field(None, alias="completedQuestions", ge=0)
    average_score: int | None = Field(None, alias="averageScore", ge=0, le=10)
    duration: int | None = Field(None, description="Duration in minutes", ge=0)
    is_active: bool | None = Field(None, alias="isActive")
    completed_at: datetime | None = Field(None, alias="completedAt")

    model_config = ConfigDict(populate_by_name=True)


class InterviewResponse(BaseModel):
    """Interview response payload."""

    id: UUID
    user_id: str | None = Field(None, alias="userId")
    session_type: str = Field(..., alias="sessionType")
    competency_focus: list[str] | None = Field(None, alias="competencyFocus")
    job_title: str | None = Field(None, alias="jobTitle")
    job_grade: str | None = Field(None, alias="jobGrade")
    framework: str | None = None
    total_questions: int = Field(..., alias="totalQuestions")
    current_question_index: int | None = Field(None, alias="currentQuestionIndex")
    completed_questions: int | None = Field(None, alias="completedQuestions")
    average_score: int | None = Field(None, alias="averageScore")
    duration: int | None = None
    started_at: datetime | None = Field(None, alias="startedAt")
    completed_at: datetime | None = Field(None, alias="completedAt")
    is_active: bool | None = Field(None, alias="isActive")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        by_alias=True,
    )


class InterviewExportResponse(BaseModel):
    """Interview export/report response."""

    interview: dict
    user: dict
    answers: int
    exported_at: str = Field(..., alias="exportedAt")

    model_config = ConfigDict(populate_by_name=True, by_alias=True)


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str
