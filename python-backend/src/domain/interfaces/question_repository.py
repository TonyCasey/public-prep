"""Question repository interface.

Defines data access operations for Question entities.
"""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities import Question
from src.domain.value_objects import Difficulty

from .repository import IRepository


class IQuestionRepository(IRepository[Question, UUID]):
    """Repository interface for Question entities.

    Extends base repository with question-specific query methods.
    """

    @abstractmethod
    async def get_by_interview(
        self,
        interview_id: UUID,
        limit: int | None = None,
    ) -> list[Question]:
        """Find all questions for a specific interview.

        Args:
            interview_id: Interview's unique identifier
            limit: Maximum number of questions to return

        Returns:
            List of interview questions
        """
        ...

    @abstractmethod
    async def get_by_user(
        self,
        user_id: str,
        limit: int | None = None,
    ) -> list[Question]:
        """Find all questions for a specific user.

        Args:
            user_id: User's unique identifier
            limit: Maximum number of questions to return

        Returns:
            List of user's questions
        """
        ...

    @abstractmethod
    async def get_by_competency(
        self,
        competency: str,
        user_id: str | None = None,
        limit: int | None = None,
    ) -> list[Question]:
        """Find questions by competency.

        Args:
            competency: Competency to filter by
            user_id: Optional user filter
            limit: Maximum number of questions to return

        Returns:
            List of questions for the competency
        """
        ...

    @abstractmethod
    async def get_by_difficulty(
        self,
        difficulty: Difficulty,
        user_id: str | None = None,
        limit: int | None = None,
    ) -> list[Question]:
        """Find questions by difficulty level.

        Args:
            difficulty: Difficulty level to filter by
            user_id: Optional user filter
            limit: Maximum number of questions to return

        Returns:
            List of questions at that difficulty
        """
        ...

    @abstractmethod
    async def get_question_at_index(
        self,
        interview_id: UUID,
        index: int,
    ) -> Question | None:
        """Get a specific question by its index in an interview.

        Args:
            interview_id: Interview's unique identifier
            index: Question index (0-based)

        Returns:
            Question at that index if exists, None otherwise
        """
        ...

    @abstractmethod
    async def count_by_interview(self, interview_id: UUID) -> int:
        """Count questions in an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Number of questions
        """
        ...

    @abstractmethod
    async def count_by_competency(
        self,
        competency: str,
        user_id: str | None = None,
    ) -> int:
        """Count questions for a competency.

        Args:
            competency: Competency to count
            user_id: Optional user filter

        Returns:
            Number of questions
        """
        ...
