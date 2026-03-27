"""Question service interface.

Defines the contract for question-related business operations.
"""

from abc import ABC, abstractmethod
from uuid import UUID

from src.domain.entities import Question


class IQuestionService(ABC):
    """Interface for question management operations."""

    @abstractmethod
    async def get_questions_by_interview(
        self,
        interview_id: UUID,
        requesting_user_id: str,
    ) -> list[Question]:
        """Get all questions for an interview.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            List of questions

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview not found
        """
        ...

    @abstractmethod
    async def get_questions_by_competency(
        self,
        competency: str,
        user_id: str,
    ) -> list[Question]:
        """Get all questions for a competency.

        Args:
            competency: Competency to filter by
            user_id: User's unique identifier

        Returns:
            List of questions for that competency
        """
        ...

    @abstractmethod
    async def get_question(
        self,
        question_id: UUID,
        requesting_user_id: str,
    ) -> Question:
        """Get a specific question by ID.

        Args:
            question_id: Question's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            The requested question

        Raises:
            PermissionError: If user doesn't own the question
            ValueError: If question not found
        """
        ...

    @abstractmethod
    async def get_current_question(
        self,
        interview_id: UUID,
        requesting_user_id: str,
    ) -> Question:
        """Get the current question for an interview session.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            Current question based on interview's currentQuestionIndex

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview or question not found
        """
        ...

    @abstractmethod
    async def create_question(
        self,
        user_id: str,
        interview_id: UUID,
        competency: str,
        question_text: str,
        difficulty: str,
    ) -> Question:
        """Create a new question.

        Args:
            user_id: User's unique identifier
            interview_id: Parent interview's ID
            competency: Competency being assessed
            question_text: The question text
            difficulty: Question difficulty level

        Returns:
            The created question

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview not found or invalid difficulty
        """
        ...

    @abstractmethod
    async def delete_question(
        self,
        question_id: UUID,
        requesting_user_id: str,
    ) -> bool:
        """Delete a question.

        Args:
            question_id: Question's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            True if deleted successfully

        Raises:
            PermissionError: If user doesn't own the question
            ValueError: If question not found
        """
        ...
