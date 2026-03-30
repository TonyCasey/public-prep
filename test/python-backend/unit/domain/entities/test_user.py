"""Unit tests for User entity."""

from datetime import UTC, datetime, timedelta

import pytest

from src.domain.entities import User
from src.domain.value_objects import SubscriptionStatus


class TestUser:
    """Tests for User entity."""

    def test_create_user_with_required_fields(self) -> None:
        """Should create user with required fields."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hashed_password",
        )

        assert user.id == "user123"
        assert user.email == "test@example.com"
        assert user.password == "hashed_password"
        assert user.subscription_status == SubscriptionStatus.FREE

    def test_default_values(self) -> None:
        """Should have correct default values."""
        user = User(id="user123", email="test@example.com", password="hash")

        assert user.first_name is None
        assert user.last_name is None
        assert user.profile_image_url is None
        assert user.stripe_customer_id is None
        assert user.subscription_id is None
        assert user.free_answers_used == 0
        assert user.starter_interviews_used == 0
        assert user.milestone_sent_70 is False
        assert user.milestone_sent_80 is False


class TestUserFullName:
    """Tests for User.full_name property."""

    def test_full_name_with_both_names(self) -> None:
        """Should return full name when both names exist."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            first_name="John",
            last_name="Doe",
        )
        assert user.full_name == "John Doe"

    def test_full_name_with_first_name_only(self) -> None:
        """Should return first name when last name missing."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            first_name="John",
        )
        assert user.full_name == "John"

    def test_full_name_with_last_name_only(self) -> None:
        """Should return last name when first name missing."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            last_name="Doe",
        )
        assert user.full_name == "Doe"

    def test_full_name_with_no_names(self) -> None:
        """Should return None when no names exist."""
        user = User(id="user123", email="test@example.com", password="hash")
        assert user.full_name is None


class TestUserSubscription:
    """Tests for User subscription properties."""

    def test_is_free(self) -> None:
        """Should correctly identify free tier."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            subscription_status=SubscriptionStatus.FREE,
        )
        assert user.is_free is True
        assert user.is_starter is False
        assert user.is_premium is False

    def test_is_starter(self) -> None:
        """Should correctly identify starter tier."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            subscription_status=SubscriptionStatus.STARTER,
        )
        assert user.is_free is False
        assert user.is_starter is True
        assert user.is_premium is False

    def test_is_premium(self) -> None:
        """Should correctly identify premium tier."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            subscription_status=SubscriptionStatus.PREMIUM,
        )
        assert user.is_free is False
        assert user.is_starter is False
        assert user.is_premium is True


class TestUserUsageLimits:
    """Tests for User usage limit methods."""

    def test_can_use_free_answer_when_under_limit(self) -> None:
        """Should allow free answer when under limit."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            subscription_status=SubscriptionStatus.FREE,
            free_answers_used=2,
        )
        assert user.can_use_free_answer(free_limit=3) is True

    def test_cannot_use_free_answer_when_at_limit(self) -> None:
        """Should not allow free answer when at limit."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            subscription_status=SubscriptionStatus.FREE,
            free_answers_used=3,
        )
        assert user.can_use_free_answer(free_limit=3) is False

    def test_cannot_use_free_answer_when_not_free_tier(self) -> None:
        """Should not allow free answer for non-free users."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            subscription_status=SubscriptionStatus.PREMIUM,
            free_answers_used=0,
        )
        assert user.can_use_free_answer() is False

    def test_can_use_starter_interview_when_valid(self) -> None:
        """Should allow starter interview when valid and under limit."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            subscription_status=SubscriptionStatus.STARTER,
            starter_interviews_used=5,
            starter_expires_at=datetime.now(UTC) + timedelta(days=30),
        )
        assert user.can_use_starter_interview(starter_limit=10) is True

    def test_cannot_use_starter_interview_when_expired(self) -> None:
        """Should not allow starter interview when expired."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            subscription_status=SubscriptionStatus.STARTER,
            starter_interviews_used=5,
            starter_expires_at=datetime.now(UTC) - timedelta(days=1),
        )
        assert user.can_use_starter_interview() is False

    def test_cannot_use_starter_interview_when_not_starter(self) -> None:
        """Should not allow starter interview for non-starter users."""
        user = User(
            id="user123",
            email="test@example.com",
            password="hash",
            subscription_status=SubscriptionStatus.FREE,
        )
        assert user.can_use_starter_interview() is False
