"""Rating repository interface.

Defines data access operations for Rating entities.
"""

from abc import abstractmethod
from decimal import Decimal
from uuid import UUID

from src.domain.entities import Rating

from .repository import IRepository


class IRatingRepository(IRepository[Rating, UUID]):
    """Repository interface for Rating entities.

    Extends base repository with rating-specific query methods.
    """

    @abstractmethod
    async def get_by_answer(self, answer_id: UUID) -> Rating | None:
        """Find the rating for a specific answer.

        Args:
            answer_id: Answer's unique identifier

        Returns:
            Rating if exists, None otherwise
        """
        ...

    @abstractmethod
    async def get_by_interview(
        self,
        interview_id: UUID,
        limit: int | None = None,
    ) -> list[Rating]:
        """Find all ratings for answers in an interview.

        Args:
            interview_id: Interview's unique identifier
            limit: Maximum number of ratings to return

        Returns:
            List of ratings
        """
        ...

    @abstractmethod
    async def get_average_score_by_interview(self, interview_id: UUID) -> Decimal | None:
        """Calculate average rating score for an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Average score if ratings exist, None otherwise
        """
        ...

    @abstractmethod
    async def get_average_score_by_competency(
        self,
        user_id: str,
        competency: str,
    ) -> Decimal | None:
        """Calculate average score for a specific competency.

        Args:
            user_id: User's unique identifier
            competency: Competency to calculate for

        Returns:
            Average score if ratings exist, None otherwise
        """
        ...

    @abstractmethod
    async def get_scores_by_competency(
        self,
        user_id: str,
    ) -> dict[str, Decimal]:
        """Get average scores grouped by competency.

        Args:
            user_id: User's unique identifier

        Returns:
            Dictionary mapping competency to average score
        """
        ...

    @abstractmethod
    async def get_recent_scores(
        self,
        user_id: str,
        limit: int = 10,
    ) -> list[Rating]:
        """Get most recent ratings for a user.

        Args:
            user_id: User's unique identifier
            limit: Maximum number of ratings to return

        Returns:
            List of recent ratings
        """
        ...

    @abstractmethod
    async def has_rating_for_answer(self, answer_id: UUID) -> bool:
        """Check if an answer has been rated.

        Args:
            answer_id: Answer's unique identifier

        Returns:
            True if rated, False otherwise
        """
        ...

    @abstractmethod
    async def count_by_score_range(
        self,
        user_id: str,
        min_score: Decimal,
        max_score: Decimal,
    ) -> int:
        """Count ratings within a score range.

        Args:
            user_id: User's unique identifier
            min_score: Minimum score (inclusive)
            max_score: Maximum score (inclusive)

        Returns:
            Number of ratings in range
        """
        ...
