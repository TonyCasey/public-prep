"""Answer service interface.

Defines the contract for answer-related business operations.
"""

from abc import ABC, abstractmethod
from uuid import UUID

from src.domain.entities import Answer


class IAnswerService(ABC):
    """Interface for answer management operations."""

    @abstractmethod
    async def get_answers_by_interview(
        self,
        interview_id: UUID,
        requesting_user_id: str,
    ) -> list[Answer]:
        """Get all answers for an interview.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            List of answers

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview not found
        """
        ...

    @abstractmethod
    async def get_answers_by_question(
        self,
        question_id: UUID,
        requesting_user_id: str,
    ) -> list[Answer]:
        """Get answers for a specific question.

        Args:
            question_id: Question's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            List of answers for the question

        Raises:
            PermissionError: If user doesn't own the question
            ValueError: If question not found
        """
        ...

    @abstractmethod
    async def get_answers_by_competency(
        self,
        competency: str,
        user_id: str,
    ) -> list[Answer]:
        """Get answers filtered by competency.

        Args:
            competency: Competency to filter by
            user_id: User's unique identifier

        Returns:
            List of answers for that competency
        """
        ...

    @abstractmethod
    async def get_answer(
        self,
        answer_id: UUID,
        requesting_user_id: str,
    ) -> Answer:
        """Get a specific answer by ID.

        Args:
            answer_id: Answer's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            The requested answer

        Raises:
            PermissionError: If user doesn't own the answer
            ValueError: If answer not found
        """
        ...

    @abstractmethod
    async def create_answer(
        self,
        interview_id: UUID,
        question_id: UUID,
        answer_text: str,
        requesting_user_id: str,
        time_spent: int | None = None,
    ) -> Answer:
        """Create or update an answer for a question.

        If an answer already exists for the question, it will be updated.

        Args:
            interview_id: Parent interview's ID
            question_id: Question being answered
            answer_text: The answer text
            requesting_user_id: ID of the user making the request
            time_spent: Time spent answering in seconds

        Returns:
            The created or updated answer

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview/question not found or invalid
        """
        ...

    @abstractmethod
    async def update_answer(
        self,
        answer_id: UUID,
        requesting_user_id: str,
        answer_text: str | None = None,
        time_spent: int | None = None,
    ) -> Answer:
        """Update an existing answer.

        Args:
            answer_id: Answer's unique identifier
            requesting_user_id: ID of the user making the request
            answer_text: New answer text
            time_spent: Updated time spent

        Returns:
            The updated answer

        Raises:
            PermissionError: If user doesn't own the answer
            ValueError: If answer not found
        """
        ...

    @abstractmethod
    async def delete_answer(
        self,
        answer_id: UUID,
        requesting_user_id: str,
    ) -> bool:
        """Delete an answer.

        Args:
            answer_id: Answer's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            True if deleted successfully

        Raises:
            PermissionError: If user doesn't own the answer
            ValueError: If answer not found
        """
        ...
