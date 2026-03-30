"""Rating DTOs (Data Transfer Objects).

Pydantic models for rating request/response validation.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RatingCreateRequest(BaseModel):
    """Rating creation request payload."""

    answer_id: UUID = Field(..., alias="answerId")
    overall_score: Decimal = Field(..., alias="overallScore", ge=0, le=10)
    competency_scores: dict[str, Any] | None = Field(None, alias="competencyScores")
    star_method_analysis: dict[str, Any] | None = Field(None, alias="starMethodAnalysis")
    feedback: str | None = None
    strengths: list[str] | None = None
    improvement_areas: list[str] | None = Field(None, alias="improvementAreas")
    ai_improved_answer: str | None = Field(None, alias="aiImprovedAnswer")

    model_config = ConfigDict(populate_by_name=True)


class RatingUpdateRequest(BaseModel):
    """Rating update request payload."""

    overall_score: Decimal | None = Field(None, alias="overallScore", ge=0, le=10)
    competency_scores: dict[str, Any] | None = Field(None, alias="competencyScores")
    star_method_analysis: dict[str, Any] | None = Field(None, alias="starMethodAnalysis")
    feedback: str | None = None
    strengths: list[str] | None = None
    improvement_areas: list[str] | None = Field(None, alias="improvementAreas")
    ai_improved_answer: str | None = Field(None, alias="aiImprovedAnswer")

    model_config = ConfigDict(populate_by_name=True)


class RatingResponse(BaseModel):
    """Rating response payload."""

    id: UUID
    answer_id: UUID | None = Field(None, alias="answerId")
    overall_score: Decimal = Field(..., alias="overallScore")
    competency_scores: dict[str, Any] | None = Field(None, alias="competencyScores")
    star_method_analysis: dict[str, Any] | None = Field(None, alias="starMethodAnalysis")
    feedback: str | None = None
    strengths: list[str] | None = None
    improvement_areas: list[str] | None = Field(None, alias="improvementAreas")
    ai_improved_answer: str | None = Field(None, alias="aiImprovedAnswer")
    evaluation: dict[str, Any] | None = None
    rated_at: datetime | None = Field(None, alias="ratedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        by_alias=True,
    )


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str
