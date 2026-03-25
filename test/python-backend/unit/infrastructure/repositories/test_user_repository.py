"""Unit tests for UserRepository."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.domain.entities import User
from src.domain.value_objects import SubscriptionStatus
from src.infrastructure.database.models import User as UserModel
from src.infrastructure.repositories import UserRepository


class TestUserRepository:
    """Tests for UserRepository."""

    def setup_method(self) -> None:
        """Set up test fixtures."""
        self.mock_session = AsyncMock()
        self.repo = UserRepository(self.mock_session)

    def _create_mock_user_model(
        self,
        user_id: str = "user123",
        email: str = "test@example.com",
        subscription_status: str = "free",
    ) -> MagicMock:
        """Create a mock UserModel."""
        model = MagicMock(spec=UserModel)
        model.id = user_id
        model.email = email
        model.password = "hashed_password"
        model.first_name = "John"
        model.last_name = "Doe"
        model.profile_image_url = None
        model.stripe_customer_id = None
        model.subscription_status = subscription_status
        model.subscription_id = None
        model.free_answers_used = 0
        model.starter_interviews_used = 0
        model.starter_expires_at = None
        model.milestone_sent_70 = False
        model.milestone_sent_80 = False
        model.created_at = datetime.utcnow()
        model.updated_at = datetime.utcnow()
        return model


class TestUserRepositoryConversion:
    """Tests for entity/model conversion."""

    def setup_method(self) -> None:
        """Set up test fixtures."""
        self.mock_session = AsyncMock()
        self.repo = UserRepository(self.mock_session)

    def test_to_entity(self) -> None:
        """Should convert UserModel to User entity."""
        model = MagicMock(spec=UserModel)
        model.id = "user123"
        model.email = "test@example.com"
        model.password = "hashed"
        model.first_name = "John"
        model.last_name = "Doe"
        model.profile_image_url = "http://example.com/img.png"
        model.stripe_customer_id = "cus_123"
        model.subscription_status = "premium"
        model.subscription_id = "sub_123"
        model.free_answers_used = 5
        model.starter_interviews_used = 3
        model.starter_expires_at = None
        model.milestone_sent_70 = True
        model.milestone_sent_80 = False
        model.created_at = datetime(2024, 1, 1)
        model.updated_at = datetime(2024, 1, 2)

        entity = self.repo._to_entity(model)

        assert entity.id == "user123"
        assert entity.email == "test@example.com"
        assert entity.password == "hashed"
        assert entity.first_name == "John"
        assert entity.last_name == "Doe"
        assert entity.subscription_status == SubscriptionStatus.PREMIUM
        assert entity.free_answers_used == 5
        assert entity.milestone_sent_70 is True

    def test_to_model(self) -> None:
        """Should convert User entity to UserModel."""
        entity = User(
            id="user456",
            email="user@example.com",
            password="password_hash",
            first_name="Jane",
            last_name="Smith",
            subscription_status=SubscriptionStatus.STARTER,
            free_answers_used=2,
        )

        model = self.repo._to_model(entity)

        assert model.id == "user456"
        assert model.email == "user@example.com"
        assert model.password == "password_hash"
        assert model.first_name == "Jane"
        assert model.subscription_status == "starter"


class TestUserRepositoryQueries:
    """Tests for UserRepository query methods."""

    def setup_method(self) -> None:
        """Set up test fixtures."""
        self.mock_session = AsyncMock()
        self.repo = UserRepository(self.mock_session)

    @pytest.mark.asyncio
    async def test_get_by_email_found(self) -> None:
        """Should return user when email found."""
        mock_model = MagicMock(spec=UserModel)
        mock_model.id = "user123"
        mock_model.email = "test@example.com"
        mock_model.password = "hash"
        mock_model.first_name = None
        mock_model.last_name = None
        mock_model.profile_image_url = None
        mock_model.stripe_customer_id = None
        mock_model.subscription_status = "free"
        mock_model.subscription_id = None
        mock_model.free_answers_used = 0
        mock_model.starter_interviews_used = 0
        mock_model.starter_expires_at = None
        mock_model.milestone_sent_70 = False
        mock_model.milestone_sent_80 = False
        mock_model.created_at = None
        mock_model.updated_at = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_model
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.get_by_email("test@example.com")

        assert result is not None
        assert result.email == "test@example.com"

    @pytest.mark.asyncio
    async def test_get_by_email_not_found(self) -> None:
        """Should return None when email not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.get_by_email("notfound@example.com")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_by_stripe_customer_id(self) -> None:
        """Should find user by Stripe customer ID."""
        mock_model = MagicMock(spec=UserModel)
        mock_model.id = "user123"
        mock_model.email = "test@example.com"
        mock_model.password = "hash"
        mock_model.first_name = None
        mock_model.last_name = None
        mock_model.profile_image_url = None
        mock_model.stripe_customer_id = "cus_123"
        mock_model.subscription_status = "premium"
        mock_model.subscription_id = "sub_123"
        mock_model.free_answers_used = 0
        mock_model.starter_interviews_used = 0
        mock_model.starter_expires_at = None
        mock_model.milestone_sent_70 = False
        mock_model.milestone_sent_80 = False
        mock_model.created_at = None
        mock_model.updated_at = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_model
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.get_by_stripe_customer_id("cus_123")

        assert result is not None
        assert result.stripe_customer_id == "cus_123"

    @pytest.mark.asyncio
    async def test_email_exists_true(self) -> None:
        """Should return True when email exists."""
        mock_model = MagicMock(spec=UserModel)
        mock_model.id = "user123"
        mock_model.email = "exists@example.com"
        mock_model.password = "hash"
        mock_model.first_name = None
        mock_model.last_name = None
        mock_model.profile_image_url = None
        mock_model.stripe_customer_id = None
        mock_model.subscription_status = "free"
        mock_model.subscription_id = None
        mock_model.free_answers_used = 0
        mock_model.starter_interviews_used = 0
        mock_model.starter_expires_at = None
        mock_model.milestone_sent_70 = False
        mock_model.milestone_sent_80 = False
        mock_model.created_at = None
        mock_model.updated_at = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_model
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.email_exists("exists@example.com")

        assert result is True

    @pytest.mark.asyncio
    async def test_email_exists_false(self) -> None:
        """Should return False when email does not exist."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.email_exists("notfound@example.com")

        assert result is False


class TestUserRepositoryUpdates:
    """Tests for UserRepository update methods."""

    def setup_method(self) -> None:
        """Set up test fixtures."""
        self.mock_session = AsyncMock()
        self.repo = UserRepository(self.mock_session)

    @pytest.mark.asyncio
    async def test_update_subscription(self) -> None:
        """Should update user subscription."""
        mock_model = MagicMock(spec=UserModel)
        mock_model.id = "user123"
        mock_model.email = "test@example.com"
        mock_model.password = "hash"
        mock_model.first_name = None
        mock_model.last_name = None
        mock_model.profile_image_url = None
        mock_model.stripe_customer_id = None
        mock_model.subscription_status = "free"
        mock_model.subscription_id = None
        mock_model.free_answers_used = 0
        mock_model.starter_interviews_used = 0
        mock_model.starter_expires_at = None
        mock_model.milestone_sent_70 = False
        mock_model.milestone_sent_80 = False
        mock_model.created_at = None
        mock_model.updated_at = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_model
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.update_subscription(
            "user123",
            SubscriptionStatus.PREMIUM,
            "sub_new",
        )

        assert mock_model.subscription_status == "premium"
        assert mock_model.subscription_id == "sub_new"
        self.mock_session.flush.assert_called()

    @pytest.mark.asyncio
    async def test_update_subscription_not_found(self) -> None:
        """Should return None when user not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.update_subscription(
            "nonexistent",
            SubscriptionStatus.PREMIUM,
        )

        assert result is None

    @pytest.mark.asyncio
    async def test_increment_free_answers(self) -> None:
        """Should increment free answers counter."""
        mock_model = MagicMock(spec=UserModel)
        mock_model.id = "user123"
        mock_model.email = "test@example.com"
        mock_model.password = "hash"
        mock_model.first_name = None
        mock_model.last_name = None
        mock_model.profile_image_url = None
        mock_model.stripe_customer_id = None
        mock_model.subscription_status = "free"
        mock_model.subscription_id = None
        mock_model.free_answers_used = 2
        mock_model.starter_interviews_used = 0
        mock_model.starter_expires_at = None
        mock_model.milestone_sent_70 = False
        mock_model.milestone_sent_80 = False
        mock_model.created_at = None
        mock_model.updated_at = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_model
        self.mock_session.execute.return_value = mock_result

        await self.repo.increment_free_answers("user123")

        assert mock_model.free_answers_used == 3
        self.mock_session.flush.assert_called()

    @pytest.mark.asyncio
    async def test_increment_starter_interviews(self) -> None:
        """Should increment starter interviews counter."""
        mock_model = MagicMock(spec=UserModel)
        mock_model.id = "user123"
        mock_model.email = "test@example.com"
        mock_model.password = "hash"
        mock_model.first_name = None
        mock_model.last_name = None
        mock_model.profile_image_url = None
        mock_model.stripe_customer_id = None
        mock_model.subscription_status = "starter"
        mock_model.subscription_id = None
        mock_model.free_answers_used = 0
        mock_model.starter_interviews_used = 5
        mock_model.starter_expires_at = None
        mock_model.milestone_sent_70 = False
        mock_model.milestone_sent_80 = False
        mock_model.created_at = None
        mock_model.updated_at = None

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_model
        self.mock_session.execute.return_value = mock_result

        await self.repo.increment_starter_interviews("user123")

        assert mock_model.starter_interviews_used == 6
        self.mock_session.flush.assert_called()
