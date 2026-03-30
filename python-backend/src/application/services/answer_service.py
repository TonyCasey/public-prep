"""Answer service implementation.

Handles answer management and business logic.
"""

import logging
from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.interfaces.answer_service import IAnswerService
from src.domain.entities import Answer
from src.domain.interfaces import IAnswerRepository, IInterviewRepository, IQuestionRepository

logger = logging.getLogger(__name__)


class AnswerService(IAnswerService):
    """Answer service implementation.

    Provides answer management with authorization checks.
    """

    def __init__(
        self,
        answer_repository: IAnswerRepository,
        interview_repository: IInterviewRepository,
        question_repository: IQuestionRepository,
    ) -> None:
        """Initialize answer service.

        Args:
            answer_repository: Answer repository for data access
            interview_repository: Interview repository for ownership checks
            question_repository: Question repository for validation
        """
        self._answer_repo = answer_repository
        self._interview_repo = interview_repository
        self._question_repo = question_repository

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

    async def _verify_answer_ownership(
        self,
        answer: Answer,
        requesting_user_id: str,
    ) -> None:
        """Verify user owns the answer via interview ownership.

        Args:
            answer: The answer to check
            requesting_user_id: ID of the requesting user

        Raises:
            PermissionError: If user doesn't own the answer
        """
        if answer.interview_id:
            interview = await self._interview_repo.get_by_id(answer.interview_id)
            if interview and interview.user_id == requesting_user_id:
                return

        logger.warning(
            f"Access denied: user {requesting_user_id} tried to access answer {answer.id}"
        )
        raise PermissionError("Access denied")

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
        await self._verify_interview_ownership(interview_id, requesting_user_id)
        return await self._answer_repo.get_by_interview(interview_id)

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
        # Verify question exists and get interview ownership
        question = await self._question_repo.get_by_id(question_id)
        if question is None:
            raise ValueError("Question not found")

        if question.interview_id:
            await self._verify_interview_ownership(question.interview_id, requesting_user_id)

        # Get the answer(s) for this question
        answer = await self._answer_repo.get_by_question(question_id)
        return [answer] if answer else []

    async def get_answers_by_competency(
        self,
        competency: str,
        user_id: str,
    ) -> list[Answer]:
        """Get answers filtered by competency.

        Gets answers for questions matching the competency across all user's interviews.

        Args:
            competency: Competency to filter by
            user_id: User's unique identifier

        Returns:
            List of answers for that competency
        """
        # Get all interviews for user
        interviews = await self._interview_repo.get_by_user(user_id)

        all_answers = []
        for interview in interviews:
            # Get questions for this interview that match competency
            questions = await self._question_repo.get_by_interview(interview.id)
            for question in questions:
                if question.competency == competency:
                    answer = await self._answer_repo.get_by_question(question.id)
                    if answer:
                        all_answers.append(answer)

        return all_answers

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
        answer = await self._answer_repo.get_by_id(answer_id)
        if answer is None:
            raise ValueError("Answer not found")

        await self._verify_answer_ownership(answer, requesting_user_id)
        return answer

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
        # Verify interview ownership
        await self._verify_interview_ownership(interview_id, requesting_user_id)

        # Verify question exists and belongs to the interview
        question = await self._question_repo.get_by_id(question_id)
        if question is None:
            raise ValueError("Question not found")
        if question.interview_id != interview_id:
            raise ValueError("Invalid question for this interview")

        # Check if answer already exists for this question
        existing_answer = await self._answer_repo.get_by_question(question_id)

        if existing_answer:
            # Update existing answer
            existing_answer.answer_text = answer_text
            if time_spent is not None:
                existing_answer.time_spent = time_spent
            existing_answer.answered_at = datetime.now(UTC)

            updated = await self._answer_repo.update(existing_answer)
            logger.info(f"Updated existing answer {updated.id} for question {question_id}")
            return updated
        else:
            # Create new answer
            answer = Answer(
                id=uuid4(),
                interview_id=interview_id,
                question_id=question_id,
                answer_text=answer_text,
                time_spent=time_spent or 0,
                answered_at=datetime.now(UTC),
            )

            created = await self._answer_repo.create(answer)
            logger.info(f"Created answer {created.id} for question {question_id}")
            return created

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
        answer = await self._answer_repo.get_by_id(answer_id)
        if answer is None:
            raise ValueError("Answer not found")

        await self._verify_answer_ownership(answer, requesting_user_id)

        # Apply updates
        if answer_text is not None:
            answer.answer_text = answer_text
        if time_spent is not None:
            answer.time_spent = time_spent

        updated = await self._answer_repo.update(answer)
        logger.info(f"Updated answer {answer_id}")

        return updated

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
        answer = await self._answer_repo.get_by_id(answer_id)
        if answer is None:
            raise ValueError("Answer not found")

        await self._verify_answer_ownership(answer, requesting_user_id)

        result = await self._answer_repo.delete(answer_id)
        if result:
            logger.info(f"Deleted answer {answer_id}")

        return result
