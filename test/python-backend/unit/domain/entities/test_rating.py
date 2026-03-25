"""Unit tests for Rating entity."""

from decimal import Decimal
from uuid import uuid4

import pytest

from src.domain.entities import Rating


class TestRating:
    """Tests for Rating entity."""

    def test_create_rating_with_required_fields(self) -> None:
        """Should create rating with required fields."""
        rating_id = uuid4()
        rating = Rating(
            id=rating_id,
            overall_score=Decimal("8.5"),
        )

        assert rating.id == rating_id
        assert rating.overall_score == Decimal("8.5")

    def test_default_values(self) -> None:
        """Should have correct default values."""
        rating = Rating(id=uuid4(), overall_score=Decimal("7.0"))

        assert rating.answer_id is None
        assert rating.competency_scores is None
        assert rating.star_method_analysis is None
        assert rating.feedback is None
        assert rating.strengths is None
        assert rating.improvement_areas is None


class TestRatingScoreProperties:
    """Tests for Rating score properties."""

    def test_score_percentage(self) -> None:
        """Should convert score to percentage."""
        rating = Rating(id=uuid4(), overall_score=Decimal("8.5"))
        assert rating.score_percentage == 85.0

    def test_is_passing_above_threshold(self) -> None:
        """Should pass when above threshold."""
        rating = Rating(id=uuid4(), overall_score=Decimal("7.0"))
        assert rating.is_passing is True

    def test_is_passing_below_threshold(self) -> None:
        """Should not pass when below threshold."""
        rating = Rating(id=uuid4(), overall_score=Decimal("5.5"))
        assert rating.is_passing is False

    def test_is_excellent_above_threshold(self) -> None:
        """Should be excellent when above threshold."""
        rating = Rating(id=uuid4(), overall_score=Decimal("9.0"))
        assert rating.is_excellent is True

    def test_is_excellent_below_threshold(self) -> None:
        """Should not be excellent when below threshold."""
        rating = Rating(id=uuid4(), overall_score=Decimal("7.5"))
        assert rating.is_excellent is False


class TestRatingStarAnalysis:
    """Tests for Rating STAR analysis methods."""

    def test_has_star_analysis_when_present(self) -> None:
        """Should detect STAR analysis presence."""
        rating = Rating(
            id=uuid4(),
            overall_score=Decimal("8.0"),
            star_method_analysis={
                "situation": {"score": 8, "feedback": "Good context"},
                "task": {"score": 7, "feedback": "Clear task"},
            },
        )
        assert rating.has_star_analysis is True

    def test_has_star_analysis_when_empty(self) -> None:
        """Should detect empty STAR analysis."""
        rating = Rating(
            id=uuid4(),
            overall_score=Decimal("8.0"),
            star_method_analysis={},
        )
        assert rating.has_star_analysis is False

    def test_has_star_analysis_when_none(self) -> None:
        """Should detect missing STAR analysis."""
        rating = Rating(id=uuid4(), overall_score=Decimal("8.0"))
        assert rating.has_star_analysis is False

    def test_get_star_component(self) -> None:
        """Should get specific STAR component."""
        rating = Rating(
            id=uuid4(),
            overall_score=Decimal("8.0"),
            star_method_analysis={
                "situation": {"score": 8, "feedback": "Good"},
                "action": {"score": 9, "feedback": "Excellent"},
            },
        )
        assert rating.get_star_component("situation") == {"score": 8, "feedback": "Good"}
        assert rating.get_star_component("action") == {"score": 9, "feedback": "Excellent"}
        assert rating.get_star_component("task") is None

    def test_get_star_component_when_no_analysis(self) -> None:
        """Should return None when no analysis exists."""
        rating = Rating(id=uuid4(), overall_score=Decimal("8.0"))
        assert rating.get_star_component("situation") is None


class TestRatingCounts:
    """Tests for Rating count properties."""

    def test_strength_count(self) -> None:
        """Should count strengths."""
        rating = Rating(
            id=uuid4(),
            overall_score=Decimal("8.0"),
            strengths=["Good structure", "Clear examples", "Strong conclusion"],
        )
        assert rating.strength_count == 3

    def test_strength_count_none(self) -> None:
        """Should return 0 when no strengths."""
        rating = Rating(id=uuid4(), overall_score=Decimal("8.0"))
        assert rating.strength_count == 0

    def test_improvement_count(self) -> None:
        """Should count improvement areas."""
        rating = Rating(
            id=uuid4(),
            overall_score=Decimal("6.0"),
            improvement_areas=["Add more detail", "Use STAR method"],
        )
        assert rating.improvement_count == 2

    def test_improvement_count_none(self) -> None:
        """Should return 0 when no improvement areas."""
        rating = Rating(id=uuid4(), overall_score=Decimal("8.0"))
        assert rating.improvement_count == 0
