"""Unit tests for QuestionService.

Tests question management business logic with mocked dependencies.
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.services.question_service import QuestionService
from src.domain.entities import Interview, Question
from src.domain.value_objects import Difficulty, Framework, Grade, SessionType


@pytest.fixture
def mock_question_repository() -> AsyncMock:
    """Create a mock question repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.get_by_interview = AsyncMock(return_value=[])
    repo.get_by_competency = AsyncMock(return_value=[])
    repo.get_question_at_index = AsyncMock(return_value=None)
    repo.create = AsyncMock()
    repo.delete = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def mock_interview_repository() -> AsyncMock:
    """Create a mock interview repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    return repo


@pytest.fixture
def question_service(
    mock_question_repository: AsyncMock,
    mock_interview_repository: AsyncMock,
) -> QuestionService:
    """Create question service with mocked dependencies."""
    return QuestionService(mock_question_repository, mock_interview_repository)


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
        question_text="Tell me about a time you led a team.",
        difficulty=Difficulty.INTERMEDIATE,
        generated_at=datetime.now(UTC),
    )


class TestGetQuestionsByInterview:
    """Tests for QuestionService.get_questions_by_interview method."""

    @pytest.mark.asyncio
    async def test_returns_questions_when_owned(
        self,
        question_service: QuestionService,
        mock_question_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_question: Question,
    ) -> None:
        """Should return questions when user owns the interview."""
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_question_repository.get_by_interview.return_value = [sample_question]

        questions = await question_service.get_questions_by_interview(
            sample_interview.id, "user-123"
        )

        assert len(questions) == 1
        assert questions[0].id == sample_question.id
        mock_question_repository.get_by_interview.assert_called_once_with(
            sample_interview.id
        )

    @pytest.mark.asyncio
    async def test_raises_value_error_when_interview_not_found(
        self,
        question_service: QuestionService,
        mock_interview_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when interview doesn't exist."""
        mock_interview_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="Interview not found"):
            await question_service.get_questions_by_interview(uuid4(), "user-123")

    @pytest.mark.asyncio
    async def test_raises_permission_error_when_not_owned(
        self,
        question_service: QuestionService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should raise PermissionError when user doesn't own interview."""
        mock_interview_repository.get_by_id.return_value = sample_interview

        with pytest.raises(PermissionError, match="Access denied"):
            await question_service.get_questions_by_interview(
                sample_interview.id, "other-user"
            )


class TestGetQuestionsByCompetency:
    """Tests for QuestionService.get_questions_by_competency method."""

    @pytest.mark.asyncio
    async def test_returns_questions_for_competency(
        self,
        question_service: QuestionService,
        mock_question_repository: AsyncMock,
        sample_question: Question,
    ) -> None:
        """Should return questions filtered by competency."""
        mock_question_repository.get_by_competency.return_value = [sample_question]

        questions = await question_service.get_questions_by_competency(
            "leadership", "user-123"
        )

        assert len(questions) == 1
        mock_question_repository.get_by_competency.assert_called_once_with(
            "leadership", "user-123"
        )


class TestGetQuestion:
    """Tests for QuestionService.get_question method."""

    @pytest.mark.asyncio
    async def test_returns_question_when_owned_directly(
        self,
        question_service: QuestionService,
        mock_question_repository: AsyncMock,
        sample_question: Question,
    ) -> None:
        """Should return question when user owns it directly."""
        mock_question_repository.get_by_id.return_value = sample_question

        question = await question_service.get_question(
            sample_question.id, "user-123"
        )

        assert question.id == sample_question.id

    @pytest.mark.asyncio
    async def test_raises_value_error_when_not_found(
        self,
        question_service: QuestionService,
        mock_question_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when question doesn't exist."""
        mock_question_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="Question not found"):
            await question_service.get_question(uuid4(), "user-123")

    @pytest.mark.asyncio
    async def test_raises_permission_error_when_not_owned(
        self,
        question_service: QuestionService,
        mock_question_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_question: Question,
    ) -> None:
        """Should raise PermissionError when user doesn't own question."""
        sample_question.user_id = "other-user"
        mock_question_repository.get_by_id.return_value = sample_question
        mock_interview_repository.get_by_id.return_value = None

        with pytest.raises(PermissionError, match="Access denied"):
            await question_service.get_question(sample_question.id, "user-123")


class TestGetCurrentQuestion:
    """Tests for QuestionService.get_current_question method."""

    @pytest.mark.asyncio
    async def test_returns_current_question(
        self,
        question_service: QuestionService,
        mock_question_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_question: Question,
    ) -> None:
        """Should return current question based on interview index."""
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_question_repository.get_question_at_index.return_value = sample_question

        question = await question_service.get_current_question(
            sample_interview.id, "user-123"
        )

        assert question.id == sample_question.id
        mock_question_repository.get_question_at_index.assert_called_once_with(
            sample_interview.id, 0
        )

    @pytest.mark.asyncio
    async def test_raises_value_error_when_no_questions(
        self,
        question_service: QuestionService,
        mock_question_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should raise ValueError when no questions found."""
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_question_repository.get_question_at_index.return_value = None

        with pytest.raises(ValueError, match="No questions found"):
            await question_service.get_current_question(
                sample_interview.id, "user-123"
            )


class TestCreateQuestion:
    """Tests for QuestionService.create_question method."""

    @pytest.mark.asyncio
    async def test_creates_question_successfully(
        self,
        question_service: QuestionService,
        mock_question_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_question: Question,
    ) -> None:
        """Should create question with valid data."""
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_question_repository.create.return_value = sample_question

        question = await question_service.create_question(
            user_id="user-123",
            interview_id=sample_interview.id,
            competency="leadership",
            question_text="Tell me about leadership.",
            difficulty="intermediate",
        )

        assert question is not None
        mock_question_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_raises_value_error_for_invalid_difficulty(
        self,
        question_service: QuestionService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should raise ValueError for invalid difficulty."""
        mock_interview_repository.get_by_id.return_value = sample_interview

        with pytest.raises(ValueError, match="Invalid difficulty"):
            await question_service.create_question(
                user_id="user-123",
                interview_id=sample_interview.id,
                competency="leadership",
                question_text="Test question",
                difficulty="invalid",
            )


class TestDeleteQuestion:
    """Tests for QuestionService.delete_question method."""

    @pytest.mark.asyncio
    async def test_deletes_question_successfully(
        self,
        question_service: QuestionService,
        mock_question_repository: AsyncMock,
        sample_question: Question,
    ) -> None:
        """Should delete question and return True."""
        mock_question_repository.get_by_id.return_value = sample_question
        mock_question_repository.delete.return_value = True

        result = await question_service.delete_question(
            sample_question.id, "user-123"
        )

        assert result is True
        mock_question_repository.delete.assert_called_once_with(sample_question.id)

    @pytest.mark.asyncio
    async def test_raises_value_error_when_not_found(
        self,
        question_service: QuestionService,
        mock_question_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when question doesn't exist."""
        mock_question_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="Question not found"):
            await question_service.delete_question(uuid4(), "user-123")
