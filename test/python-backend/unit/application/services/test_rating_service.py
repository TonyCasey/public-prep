"""Unit tests for RatingService.

Tests rating management business logic with mocked dependencies.
"""

from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.services.rating_service import RatingService
from src.domain.entities import Answer, Interview, Rating
from src.domain.value_objects import Framework, Grade, SessionType


@pytest.fixture
def mock_rating_repository() -> AsyncMock:
    """Create a mock rating repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.get_by_answer = AsyncMock(return_value=None)
    repo.get_by_interview = AsyncMock(return_value=[])
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    repo.delete = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def mock_answer_repository() -> AsyncMock:
    """Create a mock answer repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    return repo


@pytest.fixture
def mock_interview_repository() -> AsyncMock:
    """Create a mock interview repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    return repo


@pytest.fixture
def rating_service(
    mock_rating_repository: AsyncMock,
    mock_answer_repository: AsyncMock,
    mock_interview_repository: AsyncMock,
) -> RatingService:
    """Create rating service with mocked dependencies."""
    return RatingService(
        mock_rating_repository,
        mock_answer_repository,
        mock_interview_repository,
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
def sample_answer(sample_interview: Interview) -> Answer:
    """Create a sample answer for testing."""
    return Answer(
        id=uuid4(),
        interview_id=sample_interview.id,
        question_id=uuid4(),
        answer_text="My detailed answer about leadership...",
        time_spent=120,
        answered_at=datetime.now(UTC),
    )


@pytest.fixture
def sample_rating(sample_answer: Answer) -> Rating:
    """Create a sample rating for testing."""
    return Rating(
        id=uuid4(),
        answer_id=sample_answer.id,
        overall_score=Decimal("7.5"),
        competency_scores={"leadership": 8, "communication": 7},
        star_method_analysis={"situation": "Good", "task": "Clear"},
        feedback="Good answer with clear examples.",
        strengths=["Clear structure", "Good examples"],
        improvement_areas=["More specific metrics"],
        ai_improved_answer="An improved version...",
        rated_at=datetime.now(UTC),
    )


class TestGetRatingsByInterview:
    """Tests for RatingService.get_ratings_by_interview method."""

    @pytest.mark.asyncio
    async def test_returns_ratings_when_owned(
        self,
        rating_service: RatingService,
        mock_rating_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_rating: Rating,
    ) -> None:
        """Should return ratings when user owns the interview."""
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_rating_repository.get_by_interview.return_value = [sample_rating]

        ratings = await rating_service.get_ratings_by_interview(
            sample_interview.id, "user-123"
        )

        assert len(ratings) == 1
        assert ratings[0].id == sample_rating.id

    @pytest.mark.asyncio
    async def test_raises_value_error_when_interview_not_found(
        self,
        rating_service: RatingService,
        mock_interview_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when interview doesn't exist."""
        mock_interview_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="Interview not found"):
            await rating_service.get_ratings_by_interview(uuid4(), "user-123")

    @pytest.mark.asyncio
    async def test_raises_permission_error_when_not_owned(
        self,
        rating_service: RatingService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should raise PermissionError when user doesn't own interview."""
        mock_interview_repository.get_by_id.return_value = sample_interview

        with pytest.raises(PermissionError, match="Access denied"):
            await rating_service.get_ratings_by_interview(
                sample_interview.id, "other-user"
            )


class TestGetRatingByAnswer:
    """Tests for RatingService.get_rating_by_answer method."""

    @pytest.mark.asyncio
    async def test_returns_rating_when_owned(
        self,
        rating_service: RatingService,
        mock_rating_repository: AsyncMock,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_answer: Answer,
        sample_rating: Rating,
    ) -> None:
        """Should return rating for an answer."""
        mock_answer_repository.get_by_id.return_value = sample_answer
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_rating_repository.get_by_answer.return_value = sample_rating

        rating = await rating_service.get_rating_by_answer(
            sample_answer.id, "user-123"
        )

        assert rating.id == sample_rating.id

    @pytest.mark.asyncio
    async def test_raises_value_error_when_rating_not_found(
        self,
        rating_service: RatingService,
        mock_rating_repository: AsyncMock,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_answer: Answer,
    ) -> None:
        """Should raise ValueError when rating doesn't exist."""
        mock_answer_repository.get_by_id.return_value = sample_answer
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_rating_repository.get_by_answer.return_value = None

        with pytest.raises(ValueError, match="Rating not found"):
            await rating_service.get_rating_by_answer(sample_answer.id, "user-123")


class TestGetRating:
    """Tests for RatingService.get_rating method."""

    @pytest.mark.asyncio
    async def test_returns_rating_when_owned(
        self,
        rating_service: RatingService,
        mock_rating_repository: AsyncMock,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_answer: Answer,
        sample_rating: Rating,
    ) -> None:
        """Should return rating when user owns it."""
        mock_rating_repository.get_by_id.return_value = sample_rating
        mock_answer_repository.get_by_id.return_value = sample_answer
        mock_interview_repository.get_by_id.return_value = sample_interview

        rating = await rating_service.get_rating(sample_rating.id, "user-123")

        assert rating.id == sample_rating.id

    @pytest.mark.asyncio
    async def test_raises_value_error_when_not_found(
        self,
        rating_service: RatingService,
        mock_rating_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when rating doesn't exist."""
        mock_rating_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="Rating not found"):
            await rating_service.get_rating(uuid4(), "user-123")


class TestCreateRating:
    """Tests for RatingService.create_rating method."""

    @pytest.mark.asyncio
    async def test_creates_rating_successfully(
        self,
        rating_service: RatingService,
        mock_rating_repository: AsyncMock,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_answer: Answer,
        sample_rating: Rating,
    ) -> None:
        """Should create new rating."""
        mock_answer_repository.get_by_id.return_value = sample_answer
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_rating_repository.get_by_answer.return_value = None
        mock_rating_repository.create.return_value = sample_rating

        rating = await rating_service.create_rating(
            answer_id=sample_answer.id,
            overall_score=Decimal("7.5"),
            requesting_user_id="user-123",
            feedback="Good answer",
        )

        assert rating is not None
        mock_rating_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_raises_value_error_when_rating_exists(
        self,
        rating_service: RatingService,
        mock_rating_repository: AsyncMock,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_answer: Answer,
        sample_rating: Rating,
    ) -> None:
        """Should raise ValueError when rating already exists."""
        mock_answer_repository.get_by_id.return_value = sample_answer
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_rating_repository.get_by_answer.return_value = sample_rating

        with pytest.raises(ValueError, match="Rating already exists"):
            await rating_service.create_rating(
                answer_id=sample_answer.id,
                overall_score=Decimal("8.0"),
                requesting_user_id="user-123",
            )


class TestUpdateRating:
    """Tests for RatingService.update_rating method."""

    @pytest.mark.asyncio
    async def test_updates_rating_successfully(
        self,
        rating_service: RatingService,
        mock_rating_repository: AsyncMock,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_answer: Answer,
        sample_rating: Rating,
    ) -> None:
        """Should update rating fields."""
        mock_rating_repository.get_by_id.return_value = sample_rating
        mock_answer_repository.get_by_id.return_value = sample_answer
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_rating_repository.update.return_value = sample_rating

        await rating_service.update_rating(
            rating_id=sample_rating.id,
            requesting_user_id="user-123",
            feedback="Updated feedback",
        )

        mock_rating_repository.update.assert_called_once()


class TestDeleteRating:
    """Tests for RatingService.delete_rating method."""

    @pytest.mark.asyncio
    async def test_deletes_rating_successfully(
        self,
        rating_service: RatingService,
        mock_rating_repository: AsyncMock,
        mock_answer_repository: AsyncMock,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
        sample_answer: Answer,
        sample_rating: Rating,
    ) -> None:
        """Should delete rating and return True."""
        mock_rating_repository.get_by_id.return_value = sample_rating
        mock_answer_repository.get_by_id.return_value = sample_answer
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_rating_repository.delete.return_value = True

        result = await rating_service.delete_rating(
            sample_rating.id, "user-123"
        )

        assert result is True
        mock_rating_repository.delete.assert_called_once_with(sample_rating.id)

    @pytest.mark.asyncio
    async def test_raises_value_error_when_not_found(
        self,
        rating_service: RatingService,
        mock_rating_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when rating doesn't exist."""
        mock_rating_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="Rating not found"):
            await rating_service.delete_rating(uuid4(), "user-123")
