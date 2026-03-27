"""Unit tests for AnswerService.

Tests answer management business logic with mocked dependencies.
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.services.answer_service import AnswerService
from src.domain.entities import Answer, Interview, Question
from src.domain.value_objects import Difficulty, Framework, Grade, SessionType


@pytest.fixture
def mock_answer_repository() -> AsyncMock:
    """Create a mock answer repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.get_by_interview = AsyncMock(return_value=[])
    repo.get_by_question = AsyncMock(return_value=None)
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    repo.delete = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def mock_interview_repository() -> AsyncMock:
    """Create a mock interview repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.get_by_user = AsyncMock(return_value=[])
    return repo


@pytest.fixture
def mock_question_repository() -> AsyncMock:
    """Create a mock question repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.get_by_interview = AsyncMock(return_value=[])
    return repo


@pytest.fixture
def answer_service(
    mock_answer_repository: AsyncMock,
    mock_interview_repository: AsyncMock,
    mock_question_repository: AsyncMock,
) -> AnswerService:
    """Create answer service with mocked dependencies."""
    return AnswerService(
        mock_answer_repository,
        mock_interview_repository,
        mock_question_repository,
    )


@pytest.fixture
def sample_interview() -> Interview:
    """Create a sample interview for testing."""
    return Interview(
        id=uuid4(),
        user_id="user-123",
        session_type=SessionType.FULL,
        total_questions=5,
        current_question_index=0,
        is_active=True,
        started_at=datetime.now(UTC),
        job_grade=Grade.EO,
        framework=Framework.OLD,
    )


@pytest.fixture
def sample_question(sample_interview: Interview) -> Question:
    """Create a sample question for testing."""
    return Question(
        id=uuid4(),
        user_id="user-123",
        interview_id=sample_interview.id,
        competency="leadership",
        question_text="Tell me about leadership.",
        difficulty=Difficulty.INTERMEDIATE,
        generated_at=datetime.now(UTC),
    )


@pytest.fixture
def sample_answer(sample_interview: Interview, sample_question: Question) -> Answer:
    """Create a sample answer for testing."""
    return Answer(
        id=uuid4(),
        interview_id=sample_interview.id,
        question_id=sample_question.id,
        answer_text="Here is my answer about leadership...",
        time_spent=120,
        answered_at=datetime.now(UTC),
    )


class TestGetAnswersByInterview:
    """Tests for AnswerService.get_answers_by_interview method."""

    @pytest.mark.asyncio
    async def test_returns_answers_when_owned(
        self,
        answer_service: AnswerService,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_answer: Answer,
    ) -> None:
        """Should return answers when user owns the interview."""
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_answer_repository.get_by_interview.return_value = [sample_answer]

        answers = await answer_service.get_answers_by_interview(
            sample_interview.id, "user-123"
        )

        assert len(answers) == 1
        assert answers[0].id == sample_answer.id

    @pytest.mark.asyncio
    async def test_raises_value_error_when_interview_not_found(
        self,
        answer_service: AnswerService,
        mock_interview_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when interview doesn't exist."""
        mock_interview_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="Interview not found"):
            await answer_service.get_answers_by_interview(uuid4(), "user-123")

    @pytest.mark.asyncio
    async def test_raises_permission_error_when_not_owned(
        self,
        answer_service: AnswerService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should raise PermissionError when user doesn't own interview."""
        mock_interview_repository.get_by_id.return_value = sample_interview

        with pytest.raises(PermissionError, match="Access denied"):
            await answer_service.get_answers_by_interview(
                sample_interview.id, "other-user"
            )


class TestGetAnswersByQuestion:
    """Tests for AnswerService.get_answers_by_question method."""

    @pytest.mark.asyncio
    async def test_returns_answers_when_owned(
        self,
        answer_service: AnswerService,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        mock_question_repository: AsyncMock,
        sample_interview: Interview,
        sample_question: Question,
        sample_answer: Answer,
    ) -> None:
        """Should return answers for a question."""
        mock_question_repository.get_by_id.return_value = sample_question
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_answer_repository.get_by_question.return_value = sample_answer

        answers = await answer_service.get_answers_by_question(
            sample_question.id, "user-123"
        )

        assert len(answers) == 1
        assert answers[0].id == sample_answer.id

    @pytest.mark.asyncio
    async def test_raises_value_error_when_question_not_found(
        self,
        answer_service: AnswerService,
        mock_question_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when question doesn't exist."""
        mock_question_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="Question not found"):
            await answer_service.get_answers_by_question(uuid4(), "user-123")


class TestGetAnswer:
    """Tests for AnswerService.get_answer method."""

    @pytest.mark.asyncio
    async def test_returns_answer_when_owned(
        self,
        answer_service: AnswerService,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_answer: Answer,
    ) -> None:
        """Should return answer when user owns it."""
        mock_answer_repository.get_by_id.return_value = sample_answer
        mock_interview_repository.get_by_id.return_value = sample_interview

        answer = await answer_service.get_answer(sample_answer.id, "user-123")

        assert answer.id == sample_answer.id

    @pytest.mark.asyncio
    async def test_raises_value_error_when_not_found(
        self,
        answer_service: AnswerService,
        mock_answer_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when answer doesn't exist."""
        mock_answer_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="Answer not found"):
            await answer_service.get_answer(uuid4(), "user-123")


class TestCreateAnswer:
    """Tests for AnswerService.create_answer method."""

    @pytest.mark.asyncio
    async def test_creates_new_answer(
        self,
        answer_service: AnswerService,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        mock_question_repository: AsyncMock,
        sample_interview: Interview,
        sample_question: Question,
        sample_answer: Answer,
    ) -> None:
        """Should create new answer when none exists."""
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_question_repository.get_by_id.return_value = sample_question
        mock_answer_repository.get_by_question.return_value = None
        mock_answer_repository.create.return_value = sample_answer

        answer = await answer_service.create_answer(
            interview_id=sample_interview.id,
            question_id=sample_question.id,
            answer_text="My answer",
            requesting_user_id="user-123",
            time_spent=60,
        )

        assert answer is not None
        mock_answer_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_updates_existing_answer(
        self,
        answer_service: AnswerService,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        mock_question_repository: AsyncMock,
        sample_interview: Interview,
        sample_question: Question,
        sample_answer: Answer,
    ) -> None:
        """Should update existing answer when one exists."""
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_question_repository.get_by_id.return_value = sample_question
        mock_answer_repository.get_by_question.return_value = sample_answer
        mock_answer_repository.update.return_value = sample_answer

        answer = await answer_service.create_answer(
            interview_id=sample_interview.id,
            question_id=sample_question.id,
            answer_text="Updated answer",
            requesting_user_id="user-123",
        )

        assert answer is not None
        mock_answer_repository.update.assert_called_once()
        mock_answer_repository.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_raises_value_error_for_invalid_question(
        self,
        answer_service: AnswerService,
        mock_interview_repository: AsyncMock,
        mock_question_repository: AsyncMock,
        sample_interview: Interview,
        sample_question: Question,
    ) -> None:
        """Should raise ValueError when question doesn't belong to interview."""
        sample_question.interview_id = uuid4()  # Different interview
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_question_repository.get_by_id.return_value = sample_question

        with pytest.raises(ValueError, match="Invalid question for this interview"):
            await answer_service.create_answer(
                interview_id=sample_interview.id,
                question_id=sample_question.id,
                answer_text="My answer",
                requesting_user_id="user-123",
            )


class TestUpdateAnswer:
    """Tests for AnswerService.update_answer method."""

    @pytest.mark.asyncio
    async def test_updates_answer_successfully(
        self,
        answer_service: AnswerService,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_answer: Answer,
    ) -> None:
        """Should update answer fields."""
        mock_answer_repository.get_by_id.return_value = sample_answer
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_answer_repository.update.return_value = sample_answer

        await answer_service.update_answer(
            answer_id=sample_answer.id,
            requesting_user_id="user-123",
            answer_text="Updated answer text",
        )

        mock_answer_repository.update.assert_called_once()


class TestDeleteAnswer:
    """Tests for AnswerService.delete_answer method."""

    @pytest.mark.asyncio
    async def test_deletes_answer_successfully(
        self,
        answer_service: AnswerService,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_answer: Answer,
    ) -> None:
        """Should delete answer and return True."""
        mock_answer_repository.get_by_id.return_value = sample_answer
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_answer_repository.delete.return_value = True

        result = await answer_service.delete_answer(
            sample_answer.id, "user-123"
        )

        assert result is True
        mock_answer_repository.delete.assert_called_once_with(sample_answer.id)

    @pytest.mark.asyncio
    async def test_raises_value_error_when_not_found(
        self,
        answer_service: AnswerService,
        mock_answer_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when answer doesn't exist."""
        mock_answer_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="Answer not found"):
            await answer_service.delete_answer(uuid4(), "user-123")
