"""Tests for InterviewRepository implementation."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from src.domain.entities import Interview
from src.domain.value_objects import Framework, Grade, SessionType
from src.infrastructure.database.models import Interview as InterviewModel
from src.infrastructure.repositories import InterviewRepository


@pytest.fixture
def mock_session() -> AsyncMock:
    """Create a mock SQLAlchemy async session."""
    session = AsyncMock()
    return session


@pytest.fixture
def repository(mock_session: AsyncMock) -> InterviewRepository:
    """Create an InterviewRepository with a mocked session."""
    return InterviewRepository(mock_session)


@pytest.fixture
def sample_interview_model() -> InterviewModel:
    """Create a sample InterviewModel for testing."""
    model = MagicMock(spec=InterviewModel)
    model.id = uuid4()
    model.user_id = "user-123"
    model.session_type = "full"
    model.competency_focus = ["leadership", "communication"]
    model.job_title = "Executive Officer"
    model.job_grade = "eo"
    model.framework = "old"
    model.total_questions = 5
    model.current_question_index = 2
    model.completed_questions = 2
    model.average_score = 7
    model.duration = 30
    model.started_at = datetime.now(UTC)
    model.completed_at = None
    model.is_active = True
    return model


@pytest.fixture
def sample_interview_entity() -> Interview:
    """Create a sample Interview entity for testing."""
    return Interview(
        id=uuid4(),
        user_id="user-123",
        session_type=SessionType.FULL,
        competency_focus=["leadership", "communication"],
        job_title="Executive Officer",
        job_grade=Grade.EO,
        framework=Framework.OLD,
        total_questions=5,
        current_question_index=2,
        completed_questions=2,
        average_score=7,
        duration=30,
        started_at=datetime.now(UTC),
        completed_at=None,
        is_active=True,
    )


class TestInterviewRepositoryConversion:
    """Tests for entity/model conversion methods."""

    def test_to_entity(
        self, repository: InterviewRepository, sample_interview_model: InterviewModel
    ) -> None:
        """Test converting model to entity."""
        entity = repository._to_entity(sample_interview_model)

        assert entity.id == sample_interview_model.id
        assert entity.user_id == sample_interview_model.user_id
        assert entity.session_type == SessionType.FULL
        assert entity.competency_focus == sample_interview_model.competency_focus
        assert entity.job_title == sample_interview_model.job_title
        assert entity.job_grade == Grade.EO
        assert entity.framework == Framework.OLD
        assert entity.total_questions == sample_interview_model.total_questions
        assert entity.current_question_index == sample_interview_model.current_question_index
        assert entity.completed_questions == sample_interview_model.completed_questions
        assert entity.average_score == sample_interview_model.average_score
        assert entity.duration == sample_interview_model.duration
        assert entity.is_active == sample_interview_model.is_active

    def test_to_model(
        self, repository: InterviewRepository, sample_interview_entity: Interview
    ) -> None:
        """Test converting entity to model."""
        model = repository._to_model(sample_interview_entity)

        assert model.id == sample_interview_entity.id
        assert model.user_id == sample_interview_entity.user_id
        assert model.session_type == "full"
        assert model.job_grade == "eo"
        assert model.framework == "old"
        assert model.total_questions == sample_interview_entity.total_questions


class TestInterviewRepositoryQueries:
    """Tests for interview-specific query methods."""

    @pytest.mark.asyncio
    async def test_get_by_user(
        self,
        repository: InterviewRepository,
        mock_session: AsyncMock,
        sample_interview_model: InterviewModel,
    ) -> None:
        """Test getting interviews by user ID."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_interview_model]
        mock_session.execute.return_value = mock_result

        interviews = await repository.get_by_user("user-123")

        assert len(interviews) == 1
        assert interviews[0].user_id == "user-123"

    @pytest.mark.asyncio
    async def test_get_active_by_user_found(
        self,
        repository: InterviewRepository,
        mock_session: AsyncMock,
        sample_interview_model: InterviewModel,
    ) -> None:
        """Test getting active interview for user when one exists."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_interview_model
        mock_session.execute.return_value = mock_result

        interview = await repository.get_active_by_user("user-123")

        assert interview is not None
        assert interview.is_active is True

    @pytest.mark.asyncio
    async def test_get_active_by_user_not_found(
        self,
        repository: InterviewRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting active interview for user when none exists."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        interview = await repository.get_active_by_user("user-123")

        assert interview is None

    @pytest.mark.asyncio
    async def test_get_by_session_type(
        self,
        repository: InterviewRepository,
        mock_session: AsyncMock,
        sample_interview_model: InterviewModel,
    ) -> None:
        """Test getting interviews by session type."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_interview_model]
        mock_session.execute.return_value = mock_result

        interviews = await repository.get_by_session_type(SessionType.FULL)

        assert len(interviews) == 1
        assert interviews[0].session_type == SessionType.FULL

    @pytest.mark.asyncio
    async def test_get_completed_count(
        self,
        repository: InterviewRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test counting completed interviews."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 5
        mock_session.execute.return_value = mock_result

        count = await repository.get_completed_count("user-123")

        assert count == 5

    @pytest.mark.asyncio
    async def test_get_average_score(
        self,
        repository: InterviewRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting average score for user."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 7.5
        mock_session.execute.return_value = mock_result

        avg = await repository.get_average_score("user-123")

        assert avg == 7.5

    @pytest.mark.asyncio
    async def test_get_average_score_no_interviews(
        self,
        repository: InterviewRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting average score when no interviews exist."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = None
        mock_session.execute.return_value = mock_result

        avg = await repository.get_average_score("user-123")

        assert avg is None


class TestInterviewRepositoryUpdates:
    """Tests for interview update operations."""

    @pytest.mark.asyncio
    async def test_complete_interview(
        self,
        repository: InterviewRepository,
        mock_session: AsyncMock,
        sample_interview_model: InterviewModel,
    ) -> None:
        """Test marking an interview as completed."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_interview_model
        mock_session.execute.return_value = mock_result

        interview_id = sample_interview_model.id
        interview = await repository.complete_interview(
            interview_id, average_score=8, duration=45
        )

        assert interview is not None
        mock_session.flush.assert_called()
        mock_session.refresh.assert_called_with(sample_interview_model)

    @pytest.mark.asyncio
    async def test_complete_interview_not_found(
        self,
        repository: InterviewRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test completing an interview that doesn't exist."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        interview = await repository.complete_interview(uuid4())

        assert interview is None

    @pytest.mark.asyncio
    async def test_get_interviews_in_date_range(
        self,
        repository: InterviewRepository,
        mock_session: AsyncMock,
        sample_interview_model: InterviewModel,
    ) -> None:
        """Test getting interviews within a date range."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_interview_model]
        mock_session.execute.return_value = mock_result

        start = datetime(2024, 1, 1, tzinfo=UTC)
        end = datetime(2024, 12, 31, tzinfo=UTC)

        interviews = await repository.get_interviews_in_date_range("user-123", start, end)

        assert len(interviews) == 1
