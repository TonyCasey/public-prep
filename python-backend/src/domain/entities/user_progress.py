"""UserProgress domain entity.

Represents a user's progress tracking for a specific competency.
"""

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID


@dataclass
class UserProgress:
    """User progress tracking entity.

    Attributes:
        id: Unique progress record identifier
        user_id: User being tracked
        competency: Competency being tracked
        average_score: Average score for this competency (0-10)
        total_questions: Total questions answered for this competency
        improvement_rate: Improvement rate as percentage
        last_practiced: When user last practiced this competency
        updated_at: Last update timestamp
    """

    id: UUID
    competency: str
    average_score: int
    user_id: str | None = None
    total_questions: int = 0
    improvement_rate: int = 0
    last_practiced: datetime | None = None
    updated_at: datetime | None = None

    @property
    def score_percentage(self) -> float:
        """Get average score as percentage (0-100)."""
        return self.average_score * 10

    @property
    def is_improving(self) -> bool:
        """Check if user is improving in this competency."""
        return self.improvement_rate > 0

    @property
    def is_declining(self) -> bool:
        """Check if user's performance is declining."""
        return self.improvement_rate < 0

    @property
    def needs_practice(self, threshold: int = 6) -> bool:
        """Check if competency needs more practice."""
        return self.average_score < threshold

    @property
    def is_mastered(self, threshold: int = 8) -> bool:
        """Check if competency is mastered."""
        return self.average_score >= threshold and self.total_questions >= 5

    @property
    def competency_display(self) -> str:
        """Get human-readable competency name."""
        return self.competency.replace("_", " ").title()

    def update_score(self, new_score: int) -> None:
        """Update average score with new question result.

        Args:
            new_score: Score for the new question (0-10)
        """
        if self.total_questions == 0:
            self.average_score = new_score
        else:
            # Calculate new average
            total = self.average_score * self.total_questions + new_score
            self.total_questions += 1
            self.average_score = round(total / self.total_questions)

        self.last_practiced = datetime.now(UTC)
        self.updated_at = datetime.now(UTC)
