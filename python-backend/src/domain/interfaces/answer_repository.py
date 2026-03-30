"""Answer repository interface.

Defines data access operations for Answer entities.
"""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities import Answer

from .repository import IRepository


class IAnswerRepository(IRepository[Answer, UUID]):
    """Repository interface for Answer entities.

    Extends base repository with answer-specific query methods.
    """

    @abstractmethod
    async def get_by_interview(
        self,
        interview_id: UUID,
        limit: int | None = None,
    ) -> list[Answer]:
        """Find all answers for a specific interview.

        Args:
            interview_id: Interview's unique identifier
            limit: Maximum number of answers to return

        Returns:
            List of interview answers
        """
        ...

    @abstractmethod
    async def get_by_question(self, question_id: UUID) -> Answer | None:
        """Find the answer for a specific question.

        Args:
            question_id: Question's unique identifier

        Returns:
            Answer if exists, None otherwise
        """
        ...

    @abstractmethod
    async def get_latest_by_interview(self, interview_id: UUID) -> Answer | None:
        """Get the most recent answer in an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Latest answer if exists, None otherwise
        """
        ...

    @abstractmethod
    async def count_by_interview(self, interview_id: UUID) -> int:
        """Count answers in an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Number of answers
        """
        ...

    @abstractmethod
    async def get_total_time_spent(self, interview_id: UUID) -> int:
        """Calculate total time spent on all answers in an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Total time in seconds
        """
        ...

    @abstractmethod
    async def get_average_time_spent(self, interview_id: UUID) -> float | None:
        """Calculate average time spent per answer in an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Average time in seconds if answers exist, None otherwise
        """
        ...

    @abstractmethod
    async def has_answer_for_question(self, question_id: UUID) -> bool:
        """Check if a question has been answered.

        Args:
            question_id: Question's unique identifier

        Returns:
            True if answered, False otherwise
        """
        ...
