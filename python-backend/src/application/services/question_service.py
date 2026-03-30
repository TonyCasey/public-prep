"""Question service implementation.

Handles question management and business logic.
"""

import logging
from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.interfaces.question_service import IQuestionService
from src.domain.entities import Question
from src.domain.interfaces import IInterviewRepository, IQuestionRepository
from src.domain.value_objects import Difficulty

logger = logging.getLogger(__name__)


class QuestionService(IQuestionService):
    """Question service implementation.

    Provides question management with authorization checks.
    """

    def __init__(
        self,
        question_repository: IQuestionRepository,
        interview_repository: IInterviewRepository,
    ) -> None:
        """Initialize question service.

        Args:
            question_repository: Question repository for data access
            interview_repository: Interview repository for ownership checks
        """
        self._question_repo = question_repository
        self._interview_repo = interview_repository

    async def _verify_interview_ownership(
        self,
        interview_id: UUID,
        requesting_user_id: str,
    ) -> None:
        """Verify user owns the interview.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the requesting user

        Raises:
            ValueError: If interview not found
            PermissionError: If user doesn't own the interview
        """
        interview = await self._interview_repo.get_by_id(interview_id)
        if interview is None:
            raise ValueError("Interview not found")
        if interview.user_id != requesting_user_id:
            logger.warning(
                f"Access denied: user {requesting_user_id} tried to access interview {interview_id}"
            )
            raise PermissionError("Access denied")

    async def _verify_question_ownership(
        self,
        question: Question,
        requesting_user_id: str,
    ) -> None:
        """Verify user owns the question (via interview or direct ownership).

        Args:
            question: The question to check
            requesting_user_id: ID of the requesting user

        Raises:
            PermissionError: If user doesn't own the question
        """
        # Check direct ownership first
        if question.user_id == requesting_user_id:
            return

        # Check via interview ownership
        if question.interview_id:
            interview = await self._interview_repo.get_by_id(question.interview_id)
            if interview and interview.user_id == requesting_user_id:
                return

        logger.warning(
            f"Access denied: user {requesting_user_id} tried to access question {question.id}"
        )
        raise PermissionError("Access denied")

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
        await self._verify_interview_ownership(interview_id, requesting_user_id)
        return await self._question_repo.get_by_interview(interview_id)

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
        return await self._question_repo.get_by_competency(competency, user_id)

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
        question = await self._question_repo.get_by_id(question_id)
        if question is None:
            raise ValueError("Question not found")

        await self._verify_question_ownership(question, requesting_user_id)
        return question

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
        interview = await self._interview_repo.get_by_id(interview_id)
        if interview is None:
            raise ValueError("Interview not found")

        if interview.user_id != requesting_user_id:
            logger.warning(
                f"Access denied: user {requesting_user_id} tried to access interview {interview_id}"
            )
            raise PermissionError("Access denied")

        current_index = interview.current_question_index or 0
        question = await self._question_repo.get_question_at_index(interview_id, current_index)

        if question is None:
            raise ValueError("No questions found for this session")

        return question

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
        # Verify interview ownership
        await self._verify_interview_ownership(interview_id, user_id)

        # Validate difficulty
        try:
            difficulty_enum = Difficulty(difficulty.lower())
        except ValueError:
            raise ValueError(f"Invalid difficulty: {difficulty}. Must be beginner, intermediate, or advanced")

        question = Question(
            id=uuid4(),
            user_id=user_id,
            interview_id=interview_id,
            competency=competency,
            question_text=question_text,
            difficulty=difficulty_enum,
            generated_at=datetime.now(UTC),
        )

        created = await self._question_repo.create(question)
        logger.info(f"Created question {created.id} for interview {interview_id}")

        return created

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
        question = await self._question_repo.get_by_id(question_id)
        if question is None:
            raise ValueError("Question not found")

        await self._verify_question_ownership(question, requesting_user_id)

        result = await self._question_repo.delete(question_id)
        if result:
            logger.info(f"Deleted question {question_id}")

        return result
