"""Rating domain entity.

Represents an AI evaluation/rating of a user's answer.
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID


@dataclass
class Rating:
    """AI rating/evaluation entity.

    Attributes:
        id: Unique rating identifier
        answer_id: Answer being rated
        overall_score: Overall score (0-10, allows decimals)
        competency_scores: Scores by competency (JSON)
        star_method_analysis: STAR method breakdown (JSON)
        feedback: AI feedback text
        strengths: List of identified strengths
        improvement_areas: List of areas to improve
        ai_improved_answer: AI-suggested improved answer
        evaluation: Full evaluation data (JSON)
        rated_at: When rating was created
    """

    id: UUID
    overall_score: Decimal
    answer_id: UUID | None = None
    competency_scores: dict[str, Any] | None = None
    star_method_analysis: dict[str, Any] | None = None
    feedback: str | None = None
    strengths: list[str] | None = None
    improvement_areas: list[str] | None = None
    ai_improved_answer: str | None = None
    evaluation: dict[str, Any] | None = None
    rated_at: datetime | None = None

    @property
    def score_percentage(self) -> float:
        """Get score as percentage (0-100)."""
        return float(self.overall_score) * 10

    @property
    def is_passing(self, threshold: float = 6.0) -> bool:
        """Check if score meets passing threshold."""
        return float(self.overall_score) >= threshold

    @property
    def is_excellent(self, threshold: float = 8.0) -> bool:
        """Check if score is excellent."""
        return float(self.overall_score) >= threshold

    @property
    def has_star_analysis(self) -> bool:
        """Check if STAR method analysis exists."""
        return self.star_method_analysis is not None and len(self.star_method_analysis) > 0

    @property
    def strength_count(self) -> int:
        """Get number of identified strengths."""
        return len(self.strengths) if self.strengths else 0

    @property
    def improvement_count(self) -> int:
        """Get number of improvement areas."""
        return len(self.improvement_areas) if self.improvement_areas else 0

    def get_star_component(self, component: str) -> dict[str, Any] | None:
        """Get a specific STAR component analysis.

        Args:
            component: One of 'situation', 'task', 'action', 'result'

        Returns:
            Component analysis data or None
        """
        if not self.star_method_analysis:
            return None
        return self.star_method_analysis.get(component)
