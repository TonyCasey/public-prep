"""Tests for QueryBuilder LINQ-like functionality."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from src.domain.entities import User
from src.domain.value_objects import SubscriptionStatus
from src.infrastructure.database.models import User as UserModel
from src.infrastructure.repositories import QueryBuilder, UserRepository


@pytest.fixture
def mock_session() -> AsyncMock:
    """Create a mock SQLAlchemy async session."""
    return AsyncMock()


@pytest.fixture
def repository(mock_session: AsyncMock) -> UserRepository:
    """Create a UserRepository with a mocked session."""
    return UserRepository(mock_session)


@pytest.fixture
def sample_user_model() -> UserModel:
    """Create a sample UserModel for testing."""
    model = MagicMock(spec=UserModel)
    model.id = "user-123"
    model.email = "test@example.com"
    model.password = "hashed_password"
    model.first_name = "John"
    model.last_name = "Doe"
    model.profile_image_url = None
    model.stripe_customer_id = None
    model.subscription_status = "free"
    model.subscription_id = None
    model.free_answers_used = 0
    model.starter_interviews_used = 0
    model.starter_expires_at = None
    model.milestone_sent_70 = False
    model.milestone_sent_80 = False
    model.created_at = datetime.now(UTC)
    model.updated_at = datetime.now(UTC)
    return model


class TestQueryBuilder:
    """Tests for QueryBuilder fluent interface."""

    def test_query_returns_query_builder(
        self, repository: UserRepository
    ) -> None:
        """Test that query() returns a QueryBuilder instance."""
        builder = repository.query()
        assert isinstance(builder, QueryBuilder)

    def test_where_returns_self(
        self, repository: UserRepository
    ) -> None:
        """Test that where() returns self for chaining."""
        builder = repository.query()
        result = builder.where(lambda x: x.email == "test@example.com")
        assert result is builder

    def test_order_by_returns_self(
        self, repository: UserRepository
    ) -> None:
        """Test that order_by() returns self for chaining."""
        builder = repository.query()
        result = builder.order_by(lambda x: x.created_at)
        assert result is builder

    def test_order_by_desc_returns_self(
        self, repository: UserRepository
    ) -> None:
        """Test that order_by_desc() returns self for chaining."""
        builder = repository.query()
        result = builder.order_by_desc(lambda x: x.created_at)
        assert result is builder

    def test_take_returns_self(
        self, repository: UserRepository
    ) -> None:
        """Test that take() returns self for chaining."""
        builder = repository.query()
        result = builder.take(10)
        assert result is builder

    def test_skip_returns_self(
        self, repository: UserRepository
    ) -> None:
        """Test that skip() returns self for chaining."""
        builder = repository.query()
        result = builder.skip(20)
        assert result is builder

    def test_chaining_multiple_methods(
        self, repository: UserRepository
    ) -> None:
        """Test that multiple methods can be chained."""
        builder = repository.query() \
            .where(lambda x: x.subscription_status == "premium") \
            .where(lambda x: x.email.ilike("%@example.com")) \
            .order_by_desc(lambda x: x.created_at) \
            .skip(10) \
            .take(5)

        assert isinstance(builder, QueryBuilder)


class TestQueryBuilderExecution:
    """Tests for QueryBuilder query execution methods."""

    @pytest.mark.asyncio
    async def test_first_returns_entity(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
        sample_user_model: UserModel,
    ) -> None:
        """Test that first() returns the first matching entity."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_user_model]
        mock_session.execute.return_value = mock_result

        user = await repository.query() \
            .where(lambda x: x.email == "test@example.com") \
            .first()

        assert user is not None
        assert user.email == "test@example.com"

    @pytest.mark.asyncio
    async def test_first_returns_none_when_no_match(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test that first() returns None when no match."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute.return_value = mock_result

        user = await repository.query() \
            .where(lambda x: x.email == "nonexistent@example.com") \
            .first()

        assert user is None

    @pytest.mark.asyncio
    async def test_to_list_returns_all_matches(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
        sample_user_model: UserModel,
    ) -> None:
        """Test that to_list() returns all matching entities."""
        model2 = MagicMock(spec=UserModel)
        model2.id = "user-456"
        model2.email = "other@example.com"
        model2.password = "hashed"
        model2.first_name = "Jane"
        model2.last_name = "Doe"
        model2.profile_image_url = None
        model2.stripe_customer_id = None
        model2.subscription_status = "premium"
        model2.subscription_id = None
        model2.free_answers_used = 0
        model2.starter_interviews_used = 0
        model2.starter_expires_at = None
        model2.milestone_sent_70 = False
        model2.milestone_sent_80 = False
        model2.created_at = datetime.now(UTC)
        model2.updated_at = datetime.now(UTC)

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_user_model, model2]
        mock_session.execute.return_value = mock_result

        users = await repository.query().to_list()

        assert len(users) == 2

    @pytest.mark.asyncio
    async def test_count_returns_number_of_matches(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test that count() returns number of matching entities."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 5
        mock_session.execute.return_value = mock_result

        count = await repository.query() \
            .where(lambda x: x.subscription_status == "premium") \
            .count()

        assert count == 5

    @pytest.mark.asyncio
    async def test_any_returns_true_when_matches_exist(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test that any() returns True when matches exist."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 1
        mock_session.execute.return_value = mock_result

        has_any = await repository.query() \
            .where(lambda x: x.subscription_status == "premium") \
            .any()

        assert has_any is True

    @pytest.mark.asyncio
    async def test_any_returns_false_when_no_matches(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test that any() returns False when no matches."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 0
        mock_session.execute.return_value = mock_result

        has_any = await repository.query() \
            .where(lambda x: x.subscription_status == "enterprise") \
            .any()

        assert has_any is False

    @pytest.mark.asyncio
    async def test_single_returns_one_match(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
        sample_user_model: UserModel,
    ) -> None:
        """Test that single() returns the one matching entity."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_user_model]
        mock_session.execute.return_value = mock_result

        user = await repository.query() \
            .where(lambda x: x.id == "user-123") \
            .single()

        assert user is not None
        assert user.id == "user-123"

    @pytest.mark.asyncio
    async def test_single_raises_when_no_match(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test that single() raises ValueError when no match."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute.return_value = mock_result

        with pytest.raises(ValueError, match="no elements"):
            await repository.query() \
                .where(lambda x: x.id == "nonexistent") \
                .single()

    @pytest.mark.asyncio
    async def test_single_raises_when_multiple_matches(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
        sample_user_model: UserModel,
    ) -> None:
        """Test that single() raises ValueError when multiple matches."""
        model2 = MagicMock(spec=UserModel)
        model2.id = "user-456"
        model2.email = "other@example.com"
        model2.password = "hashed"
        model2.first_name = "Jane"
        model2.last_name = "Doe"
        model2.profile_image_url = None
        model2.stripe_customer_id = None
        model2.subscription_status = "premium"
        model2.subscription_id = None
        model2.free_answers_used = 0
        model2.starter_interviews_used = 0
        model2.starter_expires_at = None
        model2.milestone_sent_70 = False
        model2.milestone_sent_80 = False
        model2.created_at = datetime.now(UTC)
        model2.updated_at = datetime.now(UTC)

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_user_model, model2]
        mock_session.execute.return_value = mock_result

        with pytest.raises(ValueError, match="more than one"):
            await repository.query().single()


class TestRepositoryLinqMethods:
    """Tests for LINQ-like shorthand methods on repository."""

    @pytest.mark.asyncio
    async def test_get_with_predicate(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
        sample_user_model: UserModel,
    ) -> None:
        """Test repo.get(lambda x: x.email == email) shorthand."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_user_model]
        mock_session.execute.return_value = mock_result

        user = await repository.get(lambda x: x.email == "test@example.com")

        assert user is not None
        assert user.email == "test@example.com"

    @pytest.mark.asyncio
    async def test_get_returns_none_when_no_match(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test repo.get() returns None when no match."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute.return_value = mock_result

        user = await repository.get(lambda x: x.email == "nonexistent@example.com")

        assert user is None

    @pytest.mark.asyncio
    async def test_find_with_predicate(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
        sample_user_model: UserModel,
    ) -> None:
        """Test repo.find(lambda x: x.status == status) shorthand."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_user_model]
        mock_session.execute.return_value = mock_result

        users = await repository.find(lambda x: x.subscription_status == "free")

        assert len(users) == 1
        assert users[0].subscription_status == SubscriptionStatus.FREE

    @pytest.mark.asyncio
    async def test_any_with_predicate(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test repo.any(lambda x: x.role == role) shorthand."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 1
        mock_session.execute.return_value = mock_result

        has_premium = await repository.any(lambda x: x.subscription_status == "premium")

        assert has_premium is True

    @pytest.mark.asyncio
    async def test_any_without_predicate(
        self,
        repository: UserRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test repo.any() without predicate checks existence."""
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 5
        mock_session.execute.return_value = mock_result

        has_users = await repository.any()

        assert has_users is True
