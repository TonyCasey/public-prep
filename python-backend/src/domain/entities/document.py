"""Document domain entity.

Represents uploaded documents like CVs and job specifications.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

from src.domain.value_objects import DocumentType


@dataclass
class Document:
    """Document upload entity.

    Attributes:
        id: Unique document identifier
        user_id: Owner user's ID
        type: Document type (CV or job spec)
        filename: Original filename
        content: Extracted text content
        analysis: AI analysis results (JSON)
        uploaded_at: Upload timestamp
    """

    id: UUID
    type: DocumentType
    filename: str
    content: str
    user_id: str | None = None
    analysis: dict[str, Any] | None = None
    uploaded_at: datetime | None = None

    @property
    def is_cv(self) -> bool:
        """Check if document is a CV."""
        return self.type == DocumentType.CV

    @property
    def is_job_spec(self) -> bool:
        """Check if document is a job specification."""
        return self.type == DocumentType.JOB_SPEC

    @property
    def has_analysis(self) -> bool:
        """Check if document has been analyzed."""
        return self.analysis is not None and len(self.analysis) > 0

    @property
    def word_count(self) -> int:
        """Get approximate word count of content."""
        return len(self.content.split())
