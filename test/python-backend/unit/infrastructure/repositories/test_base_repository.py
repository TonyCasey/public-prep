"""Unit tests for base SQLAlchemy repository."""

from dataclasses import dataclass
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest

from src.infrastructure.repositories.base import PaginatedResult, SQLAlchemyRepository


@dataclass
class MockEntity:
    """Mock entity for testing."""

    id: UUID
    name: str


class MockModel:
    """Mock SQLAlchemy model for testing."""

    def __init__(self, id: UUID, name: str) -> None:
        self.id = id
        self.name = name


# Create a shared mock column for comparisons
_mock_id_column = MagicMock()


class ConcreteTestRepository(SQLAlchemyRepository[MockEntity, MockModel, UUID]):
    """Test repository implementation with mocked ID column."""

    def _get_id_column(self) -> MagicMock:
        """Override to return a mock column for testing."""
        return _mock_id_column

    def _to_entity(self, model: MockModel) -> MockEntity:
        return MockEntity(id=model.id, name=model.name)

    def _to_model(self, entity: MockEntity) -> MockModel:
        return MockModel(id=entity.id, name=entity.name)

    def _update_model(self, model: MockModel, entity: MockEntity) -> MockModel:
        model.name = entity.name
        return model


class TestSQLAlchemyRepository:
    """Tests for SQLAlchemyRepository base class."""

    def setup_method(self) -> None:
        """Set up test fixtures."""
        self.mock_session = AsyncMock()
        self.repo = ConcreteTestRepository(self.mock_session, MockModel)

    @pytest.mark.asyncio
    @patch("src.infrastructure.repositories.base.select")
    async def test_get_by_id_found(self, mock_select: MagicMock) -> None:
        """Should return entity when found."""
        entity_id = uuid4()
        mock_model = MockModel(id=entity_id, name="Test")

        # Set up the select chain mock
        mock_stmt = MagicMock()
        mock_select.return_value.where.return_value = mock_stmt

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_model
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.get_by_id(entity_id)

        assert result is not None
        assert result.id == entity_id
        assert result.name == "Test"

    @pytest.mark.asyncio
    @patch("src.infrastructure.repositories.base.select")
    async def test_get_by_id_not_found(self, mock_select: MagicMock) -> None:
        """Should return None when not found."""
        mock_stmt = MagicMock()
        mock_select.return_value.where.return_value = mock_stmt

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.get_by_id(uuid4())

        assert result is None

    @pytest.mark.asyncio
    @patch("src.infrastructure.repositories.base.select")
    async def test_get_all(self, mock_select: MagicMock) -> None:
        """Should return all entities."""
        models = [
            MockModel(id=uuid4(), name="Test1"),
            MockModel(id=uuid4(), name="Test2"),
        ]

        mock_stmt = MagicMock()
        mock_select.return_value.offset.return_value = mock_stmt

        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = models
        mock_result.scalars.return_value = mock_scalars
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.get_all()

        assert len(result) == 2
        assert result[0].name == "Test1"
        assert result[1].name == "Test2"

    @pytest.mark.asyncio
    @patch("src.infrastructure.repositories.base.select")
    async def test_get_all_with_pagination(self, mock_select: MagicMock) -> None:
        """Should apply limit and offset."""
        models = [MockModel(id=uuid4(), name="Test")]

        mock_stmt_offset = MagicMock()
        mock_stmt_limit = MagicMock()
        mock_select.return_value.offset.return_value = mock_stmt_offset
        mock_stmt_offset.limit.return_value = mock_stmt_limit

        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = models
        mock_result.scalars.return_value = mock_scalars
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.get_all(limit=10, offset=5)

        assert len(result) == 1
        self.mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_create(self) -> None:
        """Should create new entity."""
        entity = MockEntity(id=uuid4(), name="New")

        result = await self.repo.create(entity)

        self.mock_session.add.assert_called_once()
        self.mock_session.flush.assert_called_once()
        self.mock_session.refresh.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.infrastructure.repositories.base.delete")
    async def test_delete_found(self, mock_delete: MagicMock) -> None:
        """Should return True when entity deleted."""
        mock_stmt = MagicMock()
        mock_delete.return_value.where.return_value = mock_stmt

        mock_result = MagicMock()
        mock_result.rowcount = 1
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.delete(uuid4())

        assert result is True
        self.mock_session.flush.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.infrastructure.repositories.base.delete")
    async def test_delete_not_found(self, mock_delete: MagicMock) -> None:
        """Should return False when entity not found."""
        mock_stmt = MagicMock()
        mock_delete.return_value.where.return_value = mock_stmt

        mock_result = MagicMock()
        mock_result.rowcount = 0
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.delete(uuid4())

        assert result is False

    @pytest.mark.asyncio
    @patch("src.infrastructure.repositories.base.select")
    async def test_exists_true(self, mock_select: MagicMock) -> None:
        """Should return True when entity exists."""
        mock_stmt = MagicMock()
        mock_select.return_value.select_from.return_value.where.return_value = mock_stmt

        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 1
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.exists(uuid4())

        assert result is True

    @pytest.mark.asyncio
    @patch("src.infrastructure.repositories.base.select")
    async def test_exists_false(self, mock_select: MagicMock) -> None:
        """Should return False when entity does not exist."""
        mock_stmt = MagicMock()
        mock_select.return_value.select_from.return_value.where.return_value = mock_stmt

        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 0
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.exists(uuid4())

        assert result is False

    @pytest.mark.asyncio
    @patch("src.infrastructure.repositories.base.select")
    async def test_count(self, mock_select: MagicMock) -> None:
        """Should return total count."""
        mock_stmt = MagicMock()
        mock_select.return_value.select_from.return_value = mock_stmt

        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 42
        self.mock_session.execute.return_value = mock_result

        result = await self.repo.count()

        assert result == 42


class TestPaginatedResult:
    """Tests for PaginatedResult class."""

    def test_create_paginated_result(self) -> None:
        """Should create paginated result with correct values."""
        items = [MockEntity(id=uuid4(), name=f"Item{i}") for i in range(5)]

        result = PaginatedResult(
            items=items,
            total=25,
            page=2,
            page_size=5,
        )

        assert len(result.items) == 5
        assert result.total == 25
        assert result.page == 2
        assert result.page_size == 5
        assert result.total_pages == 5

    def test_has_next_true(self) -> None:
        """Should return True when there are more pages."""
        result = PaginatedResult(items=[], total=20, page=1, page_size=10)

        assert result.has_next is True

    def test_has_next_false(self) -> None:
        """Should return False on last page."""
        result = PaginatedResult(items=[], total=20, page=2, page_size=10)

        assert result.has_next is False

    def test_has_previous_true(self) -> None:
        """Should return True when not on first page."""
        result = PaginatedResult(items=[], total=20, page=2, page_size=10)

        assert result.has_previous is True

    def test_has_previous_false(self) -> None:
        """Should return False on first page."""
        result = PaginatedResult(items=[], total=20, page=1, page_size=10)

        assert result.has_previous is False

    def test_total_pages_calculation(self) -> None:
        """Should calculate total pages correctly."""
        # Exact division
        result1 = PaginatedResult(items=[], total=20, page=1, page_size=10)
        assert result1.total_pages == 2

        # With remainder
        result2 = PaginatedResult(items=[], total=25, page=1, page_size=10)
        assert result2.total_pages == 3

        # Less than one page
        result3 = PaginatedResult(items=[], total=5, page=1, page_size=10)
        assert result3.total_pages == 1

    def test_zero_page_size(self) -> None:
        """Should handle zero page size."""
        result = PaginatedResult(items=[], total=20, page=1, page_size=0)
        assert result.total_pages == 0
