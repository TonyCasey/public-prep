"""Document DTOs (Data Transfer Objects).

Pydantic models for document request/response validation.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DocumentCreateRequest(BaseModel):
    """Document creation request payload (used with file upload)."""

    type: str = Field(..., description="Document type: cv or job_spec")
    filename: str | None = Field(None, description="Optional custom filename")

    model_config = ConfigDict(populate_by_name=True)


class DocumentUpdateRequest(BaseModel):
    """Document update request payload.

    All fields are optional - only provided fields will be updated.
    """

    filename: str | None = None
    analysis: dict[str, Any] | None = None

    model_config = ConfigDict(populate_by_name=True)


class DocumentResponse(BaseModel):
    """Document response payload."""

    id: UUID
    user_id: str | None = Field(None, alias="userId")
    type: str
    filename: str
    content: str
    analysis: dict[str, Any] | None = None
    uploaded_at: datetime | None = Field(None, alias="uploadedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        by_alias=True,
    )


class DocumentAnalysisResponse(BaseModel):
    """CV analysis response payload."""

    competencies: list[str] | None = None
    skills: list[str] | None = None
    experience_years: int | None = Field(None, alias="experienceYears")
    education: list[str] | None = None
    summary: str | None = None

    model_config = ConfigDict(populate_by_name=True, by_alias=True)


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str
