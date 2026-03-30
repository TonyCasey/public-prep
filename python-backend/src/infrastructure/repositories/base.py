"""SQLAlchemy base repository implementation.

Provides a generic repository base class that implements common CRUD
operations using SQLAlchemy 2.0 async patterns.

Includes LINQ-like query builder for fluent queries:
    user = await user_repo.get(lambda x: x.email == email)

    interviews = await interview_repo.query() \\
        .where(lambda x: x.user_id == user_id) \\
        .where(lambda x: x.is_active == True) \\
        .order_by_desc(lambda x: x.started_at) \\
        .take(10) \\
        .to_list()
"""

from typing import Any, Callable, Generic, TypeVar
from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.interfaces import IRepository
from src.infrastructure.repositories.query_builder import QueryBuilder

# Type variables for entity and model types
EntityT = TypeVar("EntityT")
ModelT = TypeVar("ModelT")
IDT = TypeVar("IDT", str, UUID)


class SQLAlchemyRepository(Generic[EntityT, ModelT, IDT]):
    """Base SQLAlchemy repository implementing common CRUD operations.

    This class provides a foundation for concrete repository implementations.
    It handles the mapping between domain entities and SQLAlchemy models.

    Type Parameters:
        EntityT: Domain entity type
        ModelT: SQLAlchemy model type
        IDT: Primary key type (str or UUID)

    Attributes:
        _session: SQLAlchemy async session
        _model_class: SQLAlchemy model class
    """

    def __init__(self, session: AsyncSession, model_class: type[ModelT]) -> None:
        """Initialize repository with session and model class.

        Args:
            session: SQLAlchemy async session
            model_class: SQLAlchemy model class for this repository
        """
        self._session = session
        self._model_class = model_class

    def _get_id_column(self) -> Any:
        """Get the primary key column of the model.

        Returns:
            The primary key column
        """
        # Assumes 'id' is the primary key column name
        return getattr(self._model_class, "id")

    def _to_entity(self, model: ModelT) -> EntityT:
        """Convert SQLAlchemy model to domain entity.

        Override this method in concrete repositories to implement
        the mapping from model to entity.

        Args:
            model: SQLAlchemy model instance

        Returns:
            Domain entity instance

        Raises:
            NotImplementedError: Must be overridden in subclass
        """
        raise NotImplementedError("Subclass must implement _to_entity")

    def _to_model(self, entity: EntityT) -> ModelT:
        """Convert domain entity to SQLAlchemy model.

        Override this method in concrete repositories to implement
        the mapping from entity to model.

        Args:
            entity: Domain entity instance

        Returns:
            SQLAlchemy model instance

        Raises:
            NotImplementedError: Must be overridden in subclass
        """
        raise NotImplementedError("Subclass must implement _to_model")

    def _update_model(self, model: ModelT, entity: EntityT) -> ModelT:
        """Update an existing model with entity data.

        Override this method in concrete repositories to implement
        partial updates.

        Args:
            model: Existing SQLAlchemy model instance
            entity: Domain entity with updated data

        Returns:
            Updated SQLAlchemy model instance

        Raises:
            NotImplementedError: Must be overridden in subclass
        """
        raise NotImplementedError("Subclass must implement _update_model")

    async def get_by_id(self, entity_id: IDT) -> EntityT | None:
        """Retrieve an entity by its unique identifier.

        Args:
            entity_id: The entity's unique identifier

        Returns:
            The entity if found, None otherwise
        """
        stmt = select(self._model_class).where(self._get_id_column() == entity_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._to_entity(model)

    async def get_all(
        self,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[EntityT]:
        """Retrieve all entities with optional pagination.

        Args:
            limit: Maximum number of entities to return
            offset: Number of entities to skip

        Returns:
            List of entities
        """
        stmt = select(self._model_class).offset(offset)

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

    async def save(self, entity: EntityT) -> EntityT:
        """Persist an entity (create or update).

        If the entity exists (by ID), it will be updated.
        Otherwise, a new record will be created.

        Args:
            entity: The entity to save

        Returns:
            The saved entity (may include generated fields)
        """
        # Get entity ID
        entity_id = getattr(entity, "id", None)

        if entity_id is not None:
            # Check if entity exists
            existing = await self._get_model_by_id(entity_id)
            if existing is not None:
                # Update existing
                updated_model = self._update_model(existing, entity)
                await self._session.flush()
                await self._session.refresh(updated_model)
                return self._to_entity(updated_model)

        # Create new
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def create(self, entity: EntityT) -> EntityT:
        """Create a new entity.

        Args:
            entity: The entity to create

        Returns:
            The created entity with generated fields
        """
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: EntityT) -> EntityT | None:
        """Update an existing entity.

        Args:
            entity: The entity with updated data

        Returns:
            The updated entity, or None if not found
        """
        entity_id = getattr(entity, "id", None)
        if entity_id is None:
            return None

        existing = await self._get_model_by_id(entity_id)
        if existing is None:
            return None

        updated_model = self._update_model(existing, entity)
        await self._session.flush()
        await self._session.refresh(updated_model)
        return self._to_entity(updated_model)

    async def delete(self, entity_id: IDT) -> bool:
        """Delete an entity by its identifier.

        Args:
            entity_id: The entity's unique identifier

        Returns:
            True if entity was deleted, False if not found
        """
        stmt = delete(self._model_class).where(self._get_id_column() == entity_id)
        result = await self._session.execute(stmt)
        await self._session.flush()
        # CursorResult from execute() has rowcount attribute
        row_count: int = result.rowcount  # type: ignore[attr-defined]
        return row_count > 0

    async def exists(self, entity_id: IDT) -> bool:
        """Check if an entity exists.

        Args:
            entity_id: The entity's unique identifier

        Returns:
            True if entity exists, False otherwise
        """
        stmt = select(func.count()).select_from(self._model_class).where(
            self._get_id_column() == entity_id
        )
        result = await self._session.execute(stmt)
        count = result.scalar_one()
        return count > 0

    async def count(self) -> int:
        """Count total number of entities.

        Returns:
            Total count of entities
        """
        stmt = select(func.count()).select_from(self._model_class)
        result = await self._session.execute(stmt)
        return result.scalar_one()

    # -------------------------------------------------------------------------
    # LINQ-like Query Methods
    # -------------------------------------------------------------------------

    def query(self) -> QueryBuilder[EntityT, ModelT]:
        """Create a LINQ-like query builder.

        Returns:
            QueryBuilder for fluent query construction

        Example:
            interviews = await repo.query() \\
                .where(lambda x: x.user_id == user_id) \\
                .where(lambda x: x.is_active == True) \\
                .order_by_desc(lambda x: x.started_at) \\
                .take(10) \\
                .to_list()
        """
        return QueryBuilder(self._session, self._model_class, self._to_entity)

    async def get(self, predicate: Callable[[type[ModelT]], Any]) -> EntityT | None:
        """Get first entity matching a predicate (LINQ-style).

        Args:
            predicate: Lambda that takes model class and returns condition

        Returns:
            First matching entity, or None

        Example:
            user = await user_repo.get(lambda x: x.email == email)
            product = await product_repo.get(lambda x: x.sku == "ABC123")
        """
        return await self.query().where(predicate).first()

    async def find(
        self, predicate: Callable[[type[ModelT]], Any]
    ) -> list[EntityT]:
        """Find all entities matching a predicate (LINQ-style).

        Args:
            predicate: Lambda that takes model class and returns condition

        Returns:
            List of matching entities

        Example:
            active_users = await user_repo.find(lambda x: x.is_active == True)
            premium = await user_repo.find(lambda x: x.subscription_status == "premium")
        """
        return await self.query().where(predicate).to_list()

    async def any(self, predicate: Callable[[type[ModelT]], Any] | None = None) -> bool:
        """Check if any entities match a predicate.

        Args:
            predicate: Optional lambda condition (if None, checks if any exist)

        Returns:
            True if at least one entity matches

        Example:
            has_admin = await user_repo.any(lambda x: x.role == "admin")
            has_users = await user_repo.any()
        """
        if predicate is None:
            return await self.count() > 0
        return await self.query().where(predicate).any()

    async def _get_model_by_id(self, entity_id: IDT) -> ModelT | None:
        """Get the raw SQLAlchemy model by ID.

        Internal method for retrieving model without entity conversion.

        Args:
            entity_id: The entity's unique identifier

        Returns:
            The model if found, None otherwise
        """
        stmt = select(self._model_class).where(self._get_id_column() == entity_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()


class PaginatedResult(Generic[EntityT]):
    """Container for paginated query results.

    Attributes:
        items: List of entities for the current page
        total: Total number of entities
        page: Current page number (1-indexed)
        page_size: Number of items per page
        total_pages: Total number of pages
    """

    def __init__(
        self,
        items: list[EntityT],
        total: int,
        page: int,
        page_size: int,
    ) -> None:
        self.items = items
        self.total = total
        self.page = page
        self.page_size = page_size
        self.total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0

    @property
    def has_next(self) -> bool:
        """Check if there is a next page."""
        return self.page < self.total_pages

    @property
    def has_previous(self) -> bool:
        """Check if there is a previous page."""
        return self.page > 1
