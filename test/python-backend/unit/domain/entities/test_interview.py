"""Unit tests for Interview entity."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest

from src.domain.entities import Interview
from src.domain.value_objects import Framework, Grade, SessionType


class TestInterview:
    """Tests for Interview entity."""

    def test_create_interview_with_required_fields(self) -> None:
        """Should create interview with required fields."""
        interview_id = uuid4()
        interview = Interview(
            id=interview_id,
            user_id="user123",
            session_type=SessionType.FULL,
            total_questions=5,
        )

        assert interview.id == interview_id
        assert interview.user_id == "user123"
        assert interview.session_type == SessionType.FULL
        assert interview.total_questions == 5

    def test_default_values(self) -> None:
        """Should have correct default values."""
        interview = Interview(
            id=uuid4(),
            user_id="user123",
            session_type=SessionType.QUICK,
            total_questions=3,
        )

        assert interview.job_grade == Grade.EO
        assert interview.framework == Framework.OLD
        assert interview.current_question_index == 0
        assert interview.completed_questions == 0
        assert interview.average_score is None
        assert interview.is_active is True


class TestInterviewCompletion:
    """Tests for Interview completion methods."""

    def test_is_completed_when_completed_at_set(self) -> None:
        """Should be completed when completed_at is set."""
        interview = Interview(
            id=uuid4(),
            user_id="user123",
            session_type=SessionType.FULL,
            total_questions=5,
            completed_at=datetime.now(UTC),
        )
        assert interview.is_completed is True

    def test_is_completed_when_not_active(self) -> None:
        """Should be completed when is_active is False."""
        interview = Interview(
            id=uuid4(),
            user_id="user123",
            session_type=SessionType.FULL,
            total_questions=5,
            is_active=False,
        )
        assert interview.is_completed is True

    def test_not_completed_when_active(self) -> None:
        """Should not be completed when active."""
        interview = Interview(
            id=uuid4(),
            user_id="user123",
            session_type=SessionType.FULL,
            total_questions=5,
            is_active=True,
        )
        assert interview.is_completed is False

    def test_complete_sets_fields(self) -> None:
        """Should set completion fields."""
        interview = Interview(
            id=uuid4(),
            user_id="user123",
            session_type=SessionType.FULL,
            total_questions=5,
        )

        interview.complete(average_score=8)

        assert interview.completed_at is not None
        assert interview.is_active is False
        assert interview.average_score == 8


class TestInterviewProgress:
    """Tests for Interview progress methods."""

    def test_progress_percentage(self) -> None:
        """Should calculate progress percentage correctly."""
        interview = Interview(
            id=uuid4(),
            user_id="user123",
            session_type=SessionType.FULL,
            total_questions=10,
            completed_questions=5,
        )
        assert interview.progress_percentage == 50.0

    def test_progress_percentage_zero_questions(self) -> None:
        """Should return 0 for zero total questions."""
        interview = Interview(
            id=uuid4(),
            user_id="user123",
            session_type=SessionType.FULL,
            total_questions=0,
            completed_questions=0,
        )
        assert interview.progress_percentage == 0.0

    def test_remaining_questions(self) -> None:
        """Should calculate remaining questions."""
        interview = Interview(
            id=uuid4(),
            user_id="user123",
            session_type=SessionType.FULL,
            total_questions=10,
            completed_questions=3,
        )
        assert interview.remaining_questions == 7

    def test_advance_question(self) -> None:
        """Should advance to next question."""
        interview = Interview(
            id=uuid4(),
            user_id="user123",
            session_type=SessionType.FULL,
            total_questions=5,
            current_question_index=0,
            completed_questions=0,
        )

        interview.advance_question()

        assert interview.current_question_index == 1
        assert interview.completed_questions == 1

    def test_advance_question_at_end(self) -> None:
        """Should not advance past last question but still count completion."""
        interview = Interview(
            id=uuid4(),
            user_id="user123",
            session_type=SessionType.FULL,
            total_questions=5,
            current_question_index=4,
            completed_questions=4,
        )

        interview.advance_question()

        assert interview.current_question_index == 4  # Stays at last
        assert interview.completed_questions == 5
