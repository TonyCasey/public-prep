"""Answer domain entity.

Represents a user's answer to an interview question.
"""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Answer:
    """User answer entity.

    Attributes:
        id: Unique answer identifier
        interview_id: Parent interview ID
        question_id: Question being answered
        answer_text: User's answer text
        time_spent: Time spent answering in seconds
        answered_at: When answer was submitted
    """

    id: UUID
    answer_text: str
    interview_id: UUID | None = None
    question_id: UUID | None = None
    time_spent: int | None = None
    answered_at: datetime | None = None

    @property
    def word_count(self) -> int:
        """Get word count of answer."""
        return len(self.answer_text.split())

    @property
    def is_empty(self) -> bool:
        """Check if answer is empty or just whitespace."""
        return len(self.answer_text.strip()) == 0

    @property
    def time_spent_minutes(self) -> float | None:
        """Get time spent in minutes."""
        if self.time_spent is None:
            return None
        return self.time_spent / 60.0

    def is_sufficient_length(self, min_words: int = 50) -> bool:
        """Check if answer meets minimum length requirement."""
        return self.word_count >= min_words
