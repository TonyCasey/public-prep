"""Interview domain entity.

Represents an interview session with questions and scoring.
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID

from src.domain.value_objects import Competency, Framework, Grade, SessionType


@dataclass
class Interview:
    """Interview session entity.

    Attributes:
        id: Unique interview identifier
        user_id: Owner user's ID
        session_type: Type of interview session
        competency_focus: List of competencies to focus on
        job_title: Target job title
        job_grade: Target civil service grade
        framework: Competency framework version
        total_questions: Total number of questions
        current_question_index: Current question being answered
        completed_questions: Number of questions completed
        average_score: Average score across all answers (0-10)
        duration: Interview duration in minutes
        started_at: When interview started
        completed_at: When interview finished
        is_active: Whether interview is still in progress
    """

    id: UUID
    user_id: str | None
    session_type: SessionType
    total_questions: int
    competency_focus: list[str] | None = None
    job_title: str | None = None
    job_grade: Grade = Grade.EO
    framework: Framework = Framework.OLD
    current_question_index: int = 0
    completed_questions: int = 0
    average_score: int | None = None
    duration: int | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    is_active: bool = True

    @property
    def is_completed(self) -> bool:
        """Check if interview is completed."""
        return self.completed_at is not None or not self.is_active

    @property
    def progress_percentage(self) -> float:
        """Calculate completion percentage."""
        if self.total_questions == 0:
            return 0.0
        return (self.completed_questions / self.total_questions) * 100

    @property
    def remaining_questions(self) -> int:
        """Get number of questions remaining."""
        return self.total_questions - self.completed_questions

    def complete(self, average_score: int | None = None) -> None:
        """Mark interview as completed."""
        self.completed_at = datetime.now(UTC)
        self.is_active = False
        if average_score is not None:
            self.average_score = average_score

    def advance_question(self) -> None:
        """Move to next question."""
        if self.current_question_index < self.total_questions - 1:
            self.current_question_index += 1
        self.completed_questions += 1
