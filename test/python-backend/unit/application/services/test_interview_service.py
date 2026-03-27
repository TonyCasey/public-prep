"""Unit tests for InterviewService.

Tests interview management business logic with mocked dependencies.
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.application.services.interview_service import InterviewService
from src.domain.entities import Interview, User
from src.domain.value_objects import Framework, Grade, SessionType, SubscriptionStatus


@pytest.fixture
def mock_interview_repository() -> AsyncMock:
    """Create a mock interview repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.get_by_user = AsyncMock(return_value=[])
    repo.get_active_by_user = AsyncMock(return_value=None)
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    repo.delete = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def mock_answer_repository() -> AsyncMock:
    """Create a mock answer repository."""
    repo = AsyncMock()
    repo.get_by_interview = AsyncMock(return_value=[])
    return repo


@pytest.fixture
def mock_user_repository() -> AsyncMock:
    """Create a mock user repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    return repo


@pytest.fixture
def interview_service(
    mock_interview_repository: AsyncMock,
    mock_answer_repository: AsyncMock,
    mock_user_repository: AsyncMock,
) -> InterviewService:
    """Create interview service with mocked dependencies."""
    return InterviewService(
        mock_interview_repository,
        mock_answer_repository,
        mock_user_repository,
    )


@pytest.fixture
def sample_interview() -> Interview:
    """Create a sample interview for testing."""
    return Interview(
        id=uuid4(),
        user_id="user-123",
        session_type=SessionType.FULL,
        total_questions=10,
        competency_focus=["leadership", "communication"],
        job_title="Executive Officer",
        job_grade=Grade.EO,
        framework=Framework.OLD,
        current_question_index=0,
        completed_questions=0,
        is_active=True,
        started_at=datetime.now(UTC),
    )


@pytest.fixture
def sample_user() -> User:
    """Create a sample user for testing."""
    return User(
        id="user-123",
        email="test@example.com",
        password="hashed",
        first_name="Test",
        last_name="User",
        subscription_status=SubscriptionStatus.FREE,
    )


class TestGetUserInterviews:
    """Tests for InterviewService.get_user_interviews method."""

    @pytest.mark.asyncio
    async def test_returns_user_interviews(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should return all interviews for a user."""
        mock_interview_repository.get_by_user.return_value = [sample_interview]

        interviews = await interview_service.get_user_interviews("user-123")

        assert len(interviews) == 1
        assert interviews[0].id == sample_interview.id
        mock_interview_repository.get_by_user.assert_called_once_with("user-123")

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_interviews(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
    ) -> None:
        """Should return empty list when user has no interviews."""
        mock_interview_repository.get_by_user.return_value = []

        interviews = await interview_service.get_user_interviews("user-123")

        assert interviews == []


class TestGetInterview:
    """Tests for InterviewService.get_interview method."""

    @pytest.mark.asyncio
    async def test_returns_interview_when_owned(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should return interview when user owns it."""
        mock_interview_repository.get_by_id.return_value = sample_interview

        interview = await interview_service.get_interview(
            sample_interview.id, "user-123"
        )

        assert interview.id == sample_interview.id

    @pytest.mark.asyncio
    async def test_raises_permission_error_when_not_owned(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should raise PermissionError when user doesn't own interview."""
        mock_interview_repository.get_by_id.return_value = sample_interview

        with pytest.raises(PermissionError, match="Access denied"):
            await interview_service.get_interview(sample_interview.id, "other-user")

    @pytest.mark.asyncio
    async def test_raises_value_error_when_not_found(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when interview doesn't exist."""
        mock_interview_repository.get_by_id.return_value = None

        with pytest.raises(ValueError, match="Interview not found"):
            await interview_service.get_interview(uuid4(), "user-123")


class TestCreateInterview:
    """Tests for InterviewService.create_interview method."""

    @pytest.mark.asyncio
    async def test_creates_interview_successfully(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should create interview and return it."""
        mock_interview_repository.create.return_value = sample_interview

        interview = await interview_service.create_interview(
            user_id="user-123",
            session_type="full",
            total_questions=10,
            competency_focus=["leadership"],
            job_title="Executive Officer",
        )

        assert interview is not None
        mock_interview_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_deactivates_existing_active_interview(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should deactivate existing active interview before creating new one."""
        existing = Interview(
            id=uuid4(),
            user_id="user-123",
            session_type=SessionType.FULL,
            total_questions=5,
            is_active=True,
        )
        mock_interview_repository.get_active_by_user.return_value = existing
        mock_interview_repository.create.return_value = sample_interview

        await interview_service.create_interview(
            user_id="user-123",
            session_type="full",
            total_questions=10,
        )

        # Should have called update to deactivate existing interview
        mock_interview_repository.update.assert_called_once()
        updated_interview = mock_interview_repository.update.call_args[0][0]
        assert updated_interview.is_active is False


class TestUpdateInterview:
    """Tests for InterviewService.update_interview method."""

    @pytest.mark.asyncio
    async def test_updates_interview_successfully(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should update interview fields."""
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_interview_repository.update.return_value = sample_interview

        await interview_service.update_interview(
            interview_id=sample_interview.id,
            requesting_user_id="user-123",
            completed_questions=5,
            average_score=8,
        )

        mock_interview_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_raises_permission_error_when_not_owned(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should raise PermissionError when user doesn't own interview."""
        mock_interview_repository.get_by_id.return_value = sample_interview

        with pytest.raises(PermissionError, match="Access denied"):
            await interview_service.update_interview(
                interview_id=sample_interview.id,
                requesting_user_id="other-user",
            )


class TestDeleteInterview:
    """Tests for InterviewService.delete_interview method."""

    @pytest.mark.asyncio
    async def test_deletes_interview_successfully(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should delete interview and return True."""
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_interview_repository.delete.return_value = True

        result = await interview_service.delete_interview(
            sample_interview.id, "user-123"
        )

        assert result is True
        mock_interview_repository.delete.assert_called_once_with(sample_interview.id)

    @pytest.mark.asyncio
    async def test_raises_permission_error_when_not_owned(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should raise PermissionError when user doesn't own interview."""
        mock_interview_repository.get_by_id.return_value = sample_interview

        with pytest.raises(PermissionError, match="Access denied"):
            await interview_service.delete_interview(sample_interview.id, "other-user")


class TestExportInterview:
    """Tests for InterviewService.export_interview method."""

    @pytest.mark.asyncio
    async def test_exports_interview_report(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
        mock_answer_repository: AsyncMock,
        mock_user_repository: AsyncMock,
        sample_interview: Interview,
        sample_user: User,
    ) -> None:
        """Should return interview report data."""
        mock_interview_repository.get_by_id.return_value = sample_interview
        mock_answer_repository.get_by_interview.return_value = []
        mock_user_repository.get_by_id.return_value = sample_user

        report = await interview_service.export_interview(
            sample_interview.id, "user-123"
        )

        assert "interview" in report
        assert "user" in report
        assert "answers" in report
        assert "exportedAt" in report
        assert report["user"]["email"] == sample_user.email

    @pytest.mark.asyncio
    async def test_raises_permission_error_when_not_owned(
        self,
        interview_service: InterviewService,
        mock_interview_repository: AsyncMock,
        sample_interview: Interview,
    ) -> None:
        """Should raise PermissionError when user doesn't own interview."""
        mock_interview_repository.get_by_id.return_value = sample_interview

        with pytest.raises(PermissionError, match="Access denied"):
            await interview_service.export_interview(sample_interview.id, "other-user")
