"""Tests for AnswerRepository implementation."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from src.domain.entities import Answer
from src.infrastructure.database.models import Answer as AnswerModel
from src.infrastructure.repositories import AnswerRepository


@pytest.fixture
def mock_session() -> AsyncMock:
    """Create a mock SQLAlchemy async session."""
    session = AsyncMock()
    return session


@pytest.fixture
def repository(mock_session: AsyncMock) -> AnswerRepository:
    """Create an AnswerRepository with a mocked session."""
    return AnswerRepository(mock_session)


@pytest.fixture
def sample_answer_model() -> AnswerModel:
    """Create a sample AnswerModel for testing."""
    model = MagicMock(spec=AnswerModel)
    model.id = uuid4()
    model.interview_id = uuid4()
    model.question_id = uuid4()
    model.answer_text = "I led a team of 5 developers on a critical project..."
    model.time_spent = 180
    model.answered_at = datetime.now(UTC)
    return model


@pytest.fixture
def sample_answer_entity() -> Answer:
    """Create a sample Answer entity for testing."""
    return Answer(
        id=uuid4(),
        interview_id=uuid4(),
        question_id=uuid4(),
        answer_text="I led a team of 5 developers on a critical project...",
        time_spent=180,
        answered_at=datetime.now(UTC),
    )


class TestAnswerRepositoryConversion:
    """Tests for entity/model conversion methods."""

    def test_to_entity(
        self, repository: AnswerRepository, sample_answer_model: AnswerModel
    ) -> None:
        """Test converting model to entity."""
        entity = repository._to_entity(sample_answer_model)

        assert entity.id == sample_answer_model.id
        assert entity.interview_id == sample_answer_model.interview_id
        assert entity.question_id == sample_answer_model.question_id
        assert entity.answer_text == sample_answer_model.answer_text
        assert entity.time_spent == sample_answer_model.time_spent

    def test_to_model(
        self, repository: AnswerRepository, sample_answer_entity: Answer
    ) -> None:
        """Test converting entity to model."""
        model = repository._to_model(sample_answer_entity)

        assert model.id == sample_answer_entity.id
        assert model.interview_id == sample_answer_entity.interview_id
        assert model.question_id == sample_answer_entity.question_id
        assert model.answer_text == sample_answer_entity.answer_text
        assert model.time_spent == sample_answer_entity.time_spent


class TestAnswerRepositoryQueries:
    """Tests for answer-specific query methods."""

    @pytest.mark.asyncio
    async def test_get_by_interview(
        self,
        repository: AnswerRepository,
        mock_session: AsyncMock,
        sample_answer_model: AnswerModel,
    ) -> None:
        """Test getting answers by interview ID."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_answer_model]
        mock_session.execute.return_value = mock_result

        answers = await repository.get_by_interview(uuid4())

        assert len(answers) == 1
        assert "led a team" in answers[0].answer_text

    @pytest.mark.asyncio
    async def test_get_by_question_found(
        self,
        repository: AnswerRepository,
        mock_session: AsyncMock,
        sample_answer_model: AnswerModel,
    ) -> None:
        """Test getting answer by question ID when found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_answer_model
        mock_session.execute.return_value = mock_result

        answer = await repository.get_by_question(uuid4())

        assert answer is not None
        assert "led a team" in answer.answer_text

    @pytest.mark.asyncio
    async def test_get_by_question_not_found(
        self,
        repository: AnswerRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting answer by question ID when not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        answer = await repository.get_by_question(uuid4())

        assert answer is None

    @pytest.mark.asyncio
    async def test_get_latest_by_interview_found(
        self,
        repository: AnswerRepository,
        mock_session: AsyncMock,
        sample_answer_model: AnswerModel,
    ) -> None:
        """Test getting latest answer by interview ID."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_answer_model
        mock_session.execute.return_value = mock_result

        answer = await repository.get_latest_by_interview(uuid4())

        assert answer is not None

    @pytest.mark.asyncio
    async def test_get_latest_by_interview_not_found(
        self,
        repository: AnswerRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting latest answer when none exist."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        answer = await repository.get_latest_by_interview(uuid4())

        assert answer is None

    @pytest.mark.asyncio
    async def test_count_by_interview(
        self,
        repository: AnswerRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test counting answers by interview."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 3
        mock_session.execute.return_value = mock_result

        count = await repository.count_by_interview(uuid4())

        assert count == 3

    @pytest.mark.asyncio
    async def test_get_total_time_spent(
        self,
        repository: AnswerRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting total time spent on interview."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 540
        mock_session.execute.return_value = mock_result

        total = await repository.get_total_time_spent(uuid4())

        assert total == 540

    @pytest.mark.asyncio
    async def test_get_average_time_spent(
        self,
        repository: AnswerRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting average time spent per answer."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 180.0
        mock_session.execute.return_value = mock_result

        avg = await repository.get_average_time_spent(uuid4())

        assert avg == 180.0

    @pytest.mark.asyncio
    async def test_get_average_time_spent_no_answers(
        self,
        repository: AnswerRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting average time spent when no answers."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = None
        mock_session.execute.return_value = mock_result

        avg = await repository.get_average_time_spent(uuid4())

        assert avg is None

    @pytest.mark.asyncio
    async def test_has_answer_for_question_true(
        self,
        repository: AnswerRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test checking if question has answer when it does."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 1
        mock_session.execute.return_value = mock_result

        has_answer = await repository.has_answer_for_question(uuid4())

        assert has_answer is True

    @pytest.mark.asyncio
    async def test_has_answer_for_question_false(
        self,
        repository: AnswerRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test checking if question has answer when it doesn't."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 0
        mock_session.execute.return_value = mock_result

        has_answer = await repository.has_answer_for_question(uuid4())

        assert has_answer is False
