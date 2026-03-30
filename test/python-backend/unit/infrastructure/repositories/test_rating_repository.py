"""Tests for RatingRepository implementation."""

from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from src.domain.entities import Rating
from src.infrastructure.database.models import Rating as RatingModel
from src.infrastructure.repositories import RatingRepository


@pytest.fixture
def mock_session() -> AsyncMock:
    """Create a mock SQLAlchemy async session."""
    session = AsyncMock()
    return session


@pytest.fixture
def repository(mock_session: AsyncMock) -> RatingRepository:
    """Create a RatingRepository with a mocked session."""
    return RatingRepository(mock_session)


@pytest.fixture
def sample_rating_model() -> RatingModel:
    """Create a sample RatingModel for testing."""
    model = MagicMock(spec=RatingModel)
    model.id = uuid4()
    model.answer_id = uuid4()
    model.overall_score = Decimal("7.5")
    model.competency_scores = {"leadership": 8, "communication": 7}
    model.star_method_analysis = {
        "situation": {"score": 8},
        "task": {"score": 7},
        "action": {"score": 8},
        "result": {"score": 7},
    }
    model.feedback = "Good use of the STAR method."
    model.strengths = ["Clear communication", "Strong examples"]
    model.improvement_areas = ["More specific metrics"]
    model.ai_improved_answer = "Enhanced version of the answer..."
    model.evaluation = {"overall": "Good"}
    model.rated_at = datetime.now(UTC)
    return model


@pytest.fixture
def sample_rating_entity() -> Rating:
    """Create a sample Rating entity for testing."""
    return Rating(
        id=uuid4(),
        answer_id=uuid4(),
        overall_score=Decimal("7.5"),
        competency_scores={"leadership": 8, "communication": 7},
        star_method_analysis={
            "situation": {"score": 8},
            "task": {"score": 7},
            "action": {"score": 8},
            "result": {"score": 7},
        },
        feedback="Good use of the STAR method.",
        strengths=["Clear communication", "Strong examples"],
        improvement_areas=["More specific metrics"],
        ai_improved_answer="Enhanced version of the answer...",
        evaluation={"overall": "Good"},
        rated_at=datetime.now(UTC),
    )


class TestRatingRepositoryConversion:
    """Tests for entity/model conversion methods."""

    def test_to_entity(
        self, repository: RatingRepository, sample_rating_model: RatingModel
    ) -> None:
        """Test converting model to entity."""
        entity = repository._to_entity(sample_rating_model)

        assert entity.id == sample_rating_model.id
        assert entity.answer_id == sample_rating_model.answer_id
        assert entity.overall_score == sample_rating_model.overall_score
        assert entity.competency_scores == sample_rating_model.competency_scores
        assert entity.star_method_analysis == sample_rating_model.star_method_analysis
        assert entity.feedback == sample_rating_model.feedback
        assert entity.strengths == sample_rating_model.strengths
        assert entity.improvement_areas == sample_rating_model.improvement_areas

    def test_to_model(
        self, repository: RatingRepository, sample_rating_entity: Rating
    ) -> None:
        """Test converting entity to model."""
        model = repository._to_model(sample_rating_entity)

        assert model.id == sample_rating_entity.id
        assert model.answer_id == sample_rating_entity.answer_id
        assert model.overall_score == sample_rating_entity.overall_score
        assert model.feedback == sample_rating_entity.feedback


class TestRatingRepositoryQueries:
    """Tests for rating-specific query methods."""

    @pytest.mark.asyncio
    async def test_get_by_answer_found(
        self,
        repository: RatingRepository,
        mock_session: AsyncMock,
        sample_rating_model: RatingModel,
    ) -> None:
        """Test getting rating by answer ID when found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_rating_model
        mock_session.execute.return_value = mock_result

        rating = await repository.get_by_answer(uuid4())

        assert rating is not None
        assert rating.overall_score == Decimal("7.5")

    @pytest.mark.asyncio
    async def test_get_by_answer_not_found(
        self,
        repository: RatingRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting rating by answer ID when not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        rating = await repository.get_by_answer(uuid4())

        assert rating is None

    @pytest.mark.asyncio
    async def test_get_by_interview(
        self,
        repository: RatingRepository,
        mock_session: AsyncMock,
        sample_rating_model: RatingModel,
    ) -> None:
        """Test getting ratings by interview ID."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_rating_model]
        mock_session.execute.return_value = mock_result

        ratings = await repository.get_by_interview(uuid4())

        assert len(ratings) == 1
        assert ratings[0].overall_score == Decimal("7.5")

    @pytest.mark.asyncio
    async def test_get_average_score_by_interview(
        self,
        repository: RatingRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting average score for interview."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 7.5
        mock_session.execute.return_value = mock_result

        avg = await repository.get_average_score_by_interview(uuid4())

        assert avg == Decimal("7.5")

    @pytest.mark.asyncio
    async def test_get_average_score_by_interview_no_ratings(
        self,
        repository: RatingRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting average score when no ratings."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = None
        mock_session.execute.return_value = mock_result

        avg = await repository.get_average_score_by_interview(uuid4())

        assert avg is None

    @pytest.mark.asyncio
    async def test_get_average_score_by_competency(
        self,
        repository: RatingRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting average score for competency."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 8.0
        mock_session.execute.return_value = mock_result

        avg = await repository.get_average_score_by_competency("user-123", "leadership")

        assert avg == Decimal("8.0")

    @pytest.mark.asyncio
    async def test_get_scores_by_competency(
        self,
        repository: RatingRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting scores grouped by competency."""
        mock_row1 = MagicMock()
        mock_row1.competency = "leadership"
        mock_row1.avg_score = 8.0

        mock_row2 = MagicMock()
        mock_row2.competency = "communication"
        mock_row2.avg_score = 7.5

        mock_result = MagicMock()
        mock_result.all.return_value = [mock_row1, mock_row2]
        mock_session.execute.return_value = mock_result

        scores = await repository.get_scores_by_competency("user-123")

        assert "leadership" in scores
        assert "communication" in scores
        assert scores["leadership"] == Decimal("8.0")
        assert scores["communication"] == Decimal("7.5")

    @pytest.mark.asyncio
    async def test_get_recent_scores(
        self,
        repository: RatingRepository,
        mock_session: AsyncMock,
        sample_rating_model: RatingModel,
    ) -> None:
        """Test getting recent ratings for user."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_rating_model]
        mock_session.execute.return_value = mock_result

        ratings = await repository.get_recent_scores("user-123", limit=5)

        assert len(ratings) == 1

    @pytest.mark.asyncio
    async def test_has_rating_for_answer_true(
        self,
        repository: RatingRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test checking if answer has rating when it does."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 1
        mock_session.execute.return_value = mock_result

        has_rating = await repository.has_rating_for_answer(uuid4())

        assert has_rating is True

    @pytest.mark.asyncio
    async def test_has_rating_for_answer_false(
        self,
        repository: RatingRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test checking if answer has rating when it doesn't."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 0
        mock_session.execute.return_value = mock_result

        has_rating = await repository.has_rating_for_answer(uuid4())

        assert has_rating is False

    @pytest.mark.asyncio
    async def test_count_by_score_range(
        self,
        repository: RatingRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test counting ratings in a score range."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 5
        mock_session.execute.return_value = mock_result

        count = await repository.count_by_score_range(
            "user-123", Decimal("7.0"), Decimal("9.0")
        )

        assert count == 5
