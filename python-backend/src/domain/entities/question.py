"""Question domain entity.

Represents a generated interview question.
"""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from src.domain.value_objects import Competency, Difficulty


@dataclass
class Question:
    """Interview question entity.

    Attributes:
        id: Unique question identifier
        user_id: User who received this question
        interview_id: Parent interview ID
        competency: Competency being assessed
        question_text: The question text
        difficulty: Question difficulty level
        generated_at: When question was generated
    """

    id: UUID
    competency: str
    question_text: str
    difficulty: Difficulty
    user_id: str | None = None
    interview_id: UUID | None = None
    generated_at: datetime | None = None

    @property
    def is_beginner(self) -> bool:
        """Check if question is beginner difficulty."""
        return self.difficulty == Difficulty.BEGINNER

    @property
    def is_intermediate(self) -> bool:
        """Check if question is intermediate difficulty."""
        return self.difficulty == Difficulty.INTERMEDIATE

    @property
    def is_advanced(self) -> bool:
        """Check if question is advanced difficulty."""
        return self.difficulty == Difficulty.ADVANCED

    @property
    def competency_display(self) -> str:
        """Get human-readable competency name."""
        return self.competency.replace("_", " ").title()
