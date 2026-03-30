"""Unit tests for domain enums."""

import pytest

from src.domain.value_objects import (
    BackupType,
    Competency,
    Difficulty,
    DocumentType,
    Framework,
    Grade,
    SessionType,
    SubscriptionStatus,
)


class TestSubscriptionStatus:
    """Tests for SubscriptionStatus enum."""

    def test_has_all_expected_values(self) -> None:
        """Should have all subscription status values."""
        assert SubscriptionStatus.FREE.value == "free"
        assert SubscriptionStatus.STARTER.value == "starter"
        assert SubscriptionStatus.PREMIUM.value == "premium"
        assert SubscriptionStatus.CANCELED.value == "canceled"
        assert SubscriptionStatus.PAST_DUE.value == "past_due"

    def test_is_string_enum(self) -> None:
        """Should be usable as string comparison."""
        # String enums can be compared directly to strings
        assert SubscriptionStatus.FREE == "free"
        assert SubscriptionStatus.PREMIUM == "premium"
        # Value attribute returns the string
        assert SubscriptionStatus.FREE.value == "free"


class TestDocumentType:
    """Tests for DocumentType enum."""

    def test_has_all_expected_values(self) -> None:
        """Should have CV and job spec types."""
        assert DocumentType.CV.value == "cv"
        assert DocumentType.JOB_SPEC.value == "job_spec"

    def test_is_string_enum(self) -> None:
        """Should be usable as string comparison."""
        # String enums can be compared directly to strings
        assert DocumentType.CV == "cv"
        assert DocumentType.JOB_SPEC == "job_spec"


class TestSessionType:
    """Tests for SessionType enum."""

    def test_has_all_expected_values(self) -> None:
        """Should have all session types."""
        assert SessionType.FULL.value == "full"
        assert SessionType.COMPETENCY_FOCUS.value == "competency_focus"
        assert SessionType.QUICK.value == "quick"


class TestGrade:
    """Tests for Grade enum."""

    def test_has_all_civil_service_grades(self) -> None:
        """Should have all civil service grade levels."""
        expected_grades = ["co", "eo", "ao", "ap", "po", "as", "ds", "sg"]
        actual_grades = [g.value for g in Grade]
        assert set(actual_grades) == set(expected_grades)

    def test_grade_values(self) -> None:
        """Should have correct string values."""
        assert Grade.CO.value == "co"
        assert Grade.EO.value == "eo"
        assert Grade.SG.value == "sg"


class TestFramework:
    """Tests for Framework enum."""

    def test_has_old_and_new(self) -> None:
        """Should have old and new framework options."""
        assert Framework.OLD.value == "old"
        assert Framework.NEW.value == "new"


class TestDifficulty:
    """Tests for Difficulty enum."""

    def test_has_all_difficulty_levels(self) -> None:
        """Should have all difficulty levels."""
        assert Difficulty.BEGINNER.value == "beginner"
        assert Difficulty.INTERMEDIATE.value == "intermediate"
        assert Difficulty.ADVANCED.value == "advanced"


class TestBackupType:
    """Tests for BackupType enum."""

    def test_has_auto_and_manual(self) -> None:
        """Should have auto and manual backup types."""
        assert BackupType.AUTO.value == "auto"
        assert BackupType.MANUAL.value == "manual"


class TestCompetency:
    """Tests for Competency enum."""

    def test_has_core_competencies(self) -> None:
        """Should have core competencies."""
        assert Competency.LEADERSHIP.value == "leadership"
        assert Competency.COMMUNICATION.value == "communication"
        assert Competency.JUDGEMENT.value == "judgement"

    def test_has_new_framework_competencies(self) -> None:
        """Should have new framework competencies."""
        assert Competency.PEOPLE_MANAGEMENT.value == "people_management"
        assert Competency.ANALYSIS_AND_DECISION_MAKING.value == "analysis_and_decision_making"
        assert Competency.DELIVERY_OF_RESULTS.value == "delivery_of_results"

    def test_has_general_fallback(self) -> None:
        """Should have general competency as fallback."""
        assert Competency.GENERAL.value == "general"
