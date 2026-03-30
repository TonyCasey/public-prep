"""Rating service interface.

Defines the contract for rating-related business operations.
"""

from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any
from uuid import UUID

from src.domain.entities import Rating


class IRatingService(ABC):
    """Interface for rating management operations."""

    @abstractmethod
    async def get_ratings_by_interview(
        self,
        interview_id: UUID,
        requesting_user_id: str,
    ) -> list[Rating]:
        """Get all ratings for an interview.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            List of ratings

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview not found
        """
        ...

    @abstractmethod
    async def get_rating_by_answer(
        self,
        answer_id: UUID,
        requesting_user_id: str,
    ) -> Rating:
        """Get rating for a specific answer.

        Args:
            answer_id: Answer's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            The rating for the answer

        Raises:
            PermissionError: If user doesn't own the answer
            ValueError: If rating or answer not found
        """
        ...

    @abstractmethod
    async def get_rating(
        self,
        rating_id: UUID,
        requesting_user_id: str,
    ) -> Rating:
        """Get a specific rating by ID.

        Args:
            rating_id: Rating's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            The requested rating

        Raises:
            PermissionError: If user doesn't own the rating
            ValueError: If rating not found
        """
        ...

    @abstractmethod
    async def create_rating(
        self,
        answer_id: UUID,
        overall_score: Decimal,
        requesting_user_id: str,
        competency_scores: dict[str, Any] | None = None,
        star_method_analysis: dict[str, Any] | None = None,
        feedback: str | None = None,
        strengths: list[str] | None = None,
        improvement_areas: list[str] | None = None,
        ai_improved_answer: str | None = None,
    ) -> Rating:
        """Create a new rating for an answer.

        Args:
            answer_id: Answer being rated
            overall_score: Overall score (0-10)
            requesting_user_id: ID of the user making the request
            competency_scores: Scores by competency
            star_method_analysis: STAR method breakdown
            feedback: AI feedback text
            strengths: List of identified strengths
            improvement_areas: List of areas to improve
            ai_improved_answer: AI-suggested improved answer

        Returns:
            The created rating

        Raises:
            PermissionError: If user doesn't own the answer
            ValueError: If answer not found or rating already exists
        """
        ...

    @abstractmethod
    async def update_rating(
        self,
        rating_id: UUID,
        requesting_user_id: str,
        overall_score: Decimal | None = None,
        competency_scores: dict[str, Any] | None = None,
        star_method_analysis: dict[str, Any] | None = None,
        feedback: str | None = None,
        strengths: list[str] | None = None,
        improvement_areas: list[str] | None = None,
        ai_improved_answer: str | None = None,
    ) -> Rating:
        """Update an existing rating.

        Args:
            rating_id: Rating's unique identifier
            requesting_user_id: ID of the user making the request
            overall_score: New overall score
            competency_scores: Updated competency scores
            star_method_analysis: Updated STAR analysis
            feedback: Updated feedback
            strengths: Updated strengths
            improvement_areas: Updated improvement areas
            ai_improved_answer: Updated improved answer

        Returns:
            The updated rating

        Raises:
            PermissionError: If user doesn't own the rating
            ValueError: If rating not found
        """
        ...

    @abstractmethod
    async def delete_rating(
        self,
        rating_id: UUID,
        requesting_user_id: str,
    ) -> bool:
        """Delete a rating.

        Args:
            rating_id: Rating's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            True if deleted successfully

        Raises:
            PermissionError: If user doesn't own the rating
            ValueError: If rating not found
        """
        ...
