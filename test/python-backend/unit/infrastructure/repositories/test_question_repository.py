"""Tests for QuestionRepository implementation."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from src.domain.entities import Question
from src.domain.value_objects import Difficulty
from src.infrastructure.database.models import Question as QuestionModel
from src.infrastructure.repositories import QuestionRepository


@pytest.fixture
def mock_session() -> AsyncMock:
    """Create a mock SQLAlchemy async session."""
    session = AsyncMock()
    return session


@pytest.fixture
def repository(mock_session: AsyncMock) -> QuestionRepository:
    """Create a QuestionRepository with a mocked session."""
    return QuestionRepository(mock_session)


@pytest.fixture
def sample_question_model() -> QuestionModel:
    """Create a sample QuestionModel for testing."""
    model = MagicMock(spec=QuestionModel)
    model.id = uuid4()
    model.user_id = "user-123"
    model.interview_id = uuid4()
    model.competency = "leadership"
    model.question_text = "Describe a time when you led a team."
    model.difficulty = "intermediate"
    model.generated_at = datetime.now(UTC)
    return model


@pytest.fixture
def sample_question_entity() -> Question:
    """Create a sample Question entity for testing."""
    return Question(
        id=uuid4(),
        user_id="user-123",
        interview_id=uuid4(),
        competency="leadership",
        question_text="Describe a time when you led a team.",
        difficulty=Difficulty.INTERMEDIATE,
        generated_at=datetime.now(UTC),
    )


class TestQuestionRepositoryConversion:
    """Tests for entity/model conversion methods."""

    def test_to_entity(
        self, repository: QuestionRepository, sample_question_model: QuestionModel
    ) -> None:
        """Test converting model to entity."""
        entity = repository._to_entity(sample_question_model)

        assert entity.id == sample_question_model.id
        assert entity.user_id == sample_question_model.user_id
        assert entity.interview_id == sample_question_model.interview_id
        assert entity.competency == sample_question_model.competency
        assert entity.question_text == sample_question_model.question_text
        assert entity.difficulty == Difficulty.INTERMEDIATE

    def test_to_model(
        self, repository: QuestionRepository, sample_question_entity: Question
    ) -> None:
        """Test converting entity to model."""
        model = repository._to_model(sample_question_entity)

        assert model.id == sample_question_entity.id
        assert model.user_id == sample_question_entity.user_id
        assert model.competency == sample_question_entity.competency
        assert model.difficulty == "intermediate"


class TestQuestionRepositoryQueries:
    """Tests for question-specific query methods."""

    @pytest.mark.asyncio
    async def test_get_by_interview(
        self,
        repository: QuestionRepository,
        mock_session: AsyncMock,
        sample_question_model: QuestionModel,
    ) -> None:
        """Test getting questions by interview ID."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_question_model]
        mock_session.execute.return_value = mock_result

        questions = await repository.get_by_interview(uuid4())

        assert len(questions) == 1
        assert questions[0].competency == "leadership"

    @pytest.mark.asyncio
    async def test_get_by_user(
        self,
        repository: QuestionRepository,
        mock_session: AsyncMock,
        sample_question_model: QuestionModel,
    ) -> None:
        """Test getting questions by user ID."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_question_model]
        mock_session.execute.return_value = mock_result

        questions = await repository.get_by_user("user-123")

        assert len(questions) == 1
        assert questions[0].user_id == "user-123"

    @pytest.mark.asyncio
    async def test_get_by_competency(
        self,
        repository: QuestionRepository,
        mock_session: AsyncMock,
        sample_question_model: QuestionModel,
    ) -> None:
        """Test getting questions by competency."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_question_model]
        mock_session.execute.return_value = mock_result

        questions = await repository.get_by_competency("leadership")

        assert len(questions) == 1
        assert questions[0].competency == "leadership"

    @pytest.mark.asyncio
    async def test_get_by_difficulty(
        self,
        repository: QuestionRepository,
        mock_session: AsyncMock,
        sample_question_model: QuestionModel,
    ) -> None:
        """Test getting questions by difficulty."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_question_model]
        mock_session.execute.return_value = mock_result

        questions = await repository.get_by_difficulty(Difficulty.INTERMEDIATE)

        assert len(questions) == 1
        assert questions[0].difficulty == Difficulty.INTERMEDIATE

    @pytest.mark.asyncio
    async def test_get_question_at_index_found(
        self,
        repository: QuestionRepository,
        mock_session: AsyncMock,
        sample_question_model: QuestionModel,
    ) -> None:
        """Test getting question at specific index."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_question_model
        mock_session.execute.return_value = mock_result

        question = await repository.get_question_at_index(uuid4(), 0)

        assert question is not None
        assert question.competency == "leadership"

    @pytest.mark.asyncio
    async def test_get_question_at_index_not_found(
        self,
        repository: QuestionRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting question at index when not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        question = await repository.get_question_at_index(uuid4(), 99)

        assert question is None

    @pytest.mark.asyncio
    async def test_count_by_interview(
        self,
        repository: QuestionRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test counting questions by interview."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 5
        mock_session.execute.return_value = mock_result

        count = await repository.count_by_interview(uuid4())

        assert count == 5

    @pytest.mark.asyncio
    async def test_count_by_competency(
        self,
        repository: QuestionRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test counting questions by competency."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 10
        mock_session.execute.return_value = mock_result

        count = await repository.count_by_competency("leadership")

        assert count == 10
