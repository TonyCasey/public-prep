"""Unit tests for Answer entity."""

from datetime import datetime
from uuid import uuid4

import pytest

from src.domain.entities import Answer


class TestAnswer:
    """Tests for Answer entity."""

    def test_create_answer_with_required_fields(self) -> None:
        """Should create answer with required fields."""
        answer_id = uuid4()
        answer = Answer(
            id=answer_id,
            answer_text="This is my answer to the question.",
        )

        assert answer.id == answer_id
        assert answer.answer_text == "This is my answer to the question."

    def test_default_values(self) -> None:
        """Should have correct default values."""
        answer = Answer(id=uuid4(), answer_text="Answer text")

        assert answer.interview_id is None
        assert answer.question_id is None
        assert answer.time_spent is None
        assert answer.answered_at is None


class TestAnswerWordCount:
    """Tests for Answer.word_count property."""

    def test_word_count(self) -> None:
        """Should count words correctly."""
        answer = Answer(
            id=uuid4(),
            answer_text="This is a five word answer",
        )
        assert answer.word_count == 6

    def test_word_count_empty(self) -> None:
        """Should return 0 for empty answer."""
        answer = Answer(id=uuid4(), answer_text="")
        assert answer.word_count == 0


class TestAnswerValidation:
    """Tests for Answer validation methods."""

    def test_is_empty_for_empty_string(self) -> None:
        """Should detect empty answer."""
        answer = Answer(id=uuid4(), answer_text="")
        assert answer.is_empty is True

    def test_is_empty_for_whitespace(self) -> None:
        """Should detect whitespace-only answer."""
        answer = Answer(id=uuid4(), answer_text="   \n\t  ")
        assert answer.is_empty is True

    def test_is_not_empty_for_content(self) -> None:
        """Should detect non-empty answer."""
        answer = Answer(id=uuid4(), answer_text="Some content")
        assert answer.is_empty is False

    def test_is_sufficient_length(self) -> None:
        """Should check minimum length."""
        long_answer = Answer(
            id=uuid4(),
            answer_text=" ".join(["word"] * 50),
        )
        short_answer = Answer(
            id=uuid4(),
            answer_text=" ".join(["word"] * 20),
        )

        assert long_answer.is_sufficient_length(min_words=50) is True
        assert short_answer.is_sufficient_length(min_words=50) is False


class TestAnswerTimeSpent:
    """Tests for Answer.time_spent_minutes property."""

    def test_time_spent_minutes(self) -> None:
        """Should convert seconds to minutes."""
        answer = Answer(
            id=uuid4(),
            answer_text="Answer",
            time_spent=120,
        )
        assert answer.time_spent_minutes == 2.0

    def test_time_spent_minutes_none(self) -> None:
        """Should return None when time_spent is None."""
        answer = Answer(id=uuid4(), answer_text="Answer")
        assert answer.time_spent_minutes is None
