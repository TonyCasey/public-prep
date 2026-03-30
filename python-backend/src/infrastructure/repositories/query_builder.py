"""LINQ-like query builder for SQLAlchemy repositories.

Provides a fluent interface for building database queries with
lambda-based predicates, similar to C# LINQ.

Example:
    # Simple get
    user = await user_repo.get(lambda x: x.email == email)

    # Fluent query
    interviews = await interview_repo.query() \\
        .where(lambda x: x.user_id == user_id) \\
        .where(lambda x: x.is_active == True) \\
        .order_by(lambda x: x.started_at.desc()) \\
        .take(10) \\
        .to_list()
"""

from typing import Any, Callable, Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

EntityT = TypeVar("EntityT")
ModelT = TypeVar("ModelT")


class QueryBuilder(Generic[EntityT, ModelT]):
    """Fluent query builder with LINQ-like syntax.

    Builds SQLAlchemy queries using lambda predicates and executes
    them against the database.

    Type Parameters:
        EntityT: Domain entity type returned by queries
        ModelT: SQLAlchemy model type for database operations
    """

    def __init__(
        self,
        session: AsyncSession,
        model_class: type[ModelT],
        to_entity: Callable[[ModelT], EntityT],
    ) -> None:
        """Initialize query builder.

        Args:
            session: SQLAlchemy async session
            model_class: SQLAlchemy model class to query
            to_entity: Function to convert model to entity
        """
        self._session = session
        self._model = model_class
        self._to_entity = to_entity
        self._filters: list[Any] = []
        self._order_by_clauses: list[Any] = []
        self._limit: int | None = None
        self._offset: int = 0

    def where(self, predicate: Callable[[type[ModelT]], Any]) -> "QueryBuilder[EntityT, ModelT]":
        """Add a filter condition.

        Args:
            predicate: Lambda that takes model class and returns SQLAlchemy condition

        Returns:
            Self for method chaining

        Example:
            .where(lambda x: x.email == "test@example.com")
            .where(lambda x: x.price > 100)
            .where(lambda x: x.name.ilike("%search%"))
        """
        self._filters.append(predicate(self._model))
        return self

    def order_by(self, key: Callable[[type[ModelT]], Any]) -> "QueryBuilder[EntityT, ModelT]":
        """Add ascending sort order.

        Args:
            key: Lambda that returns column to sort by

        Returns:
            Self for method chaining

        Example:
            .order_by(lambda x: x.created_at)
            .order_by(lambda x: x.name)
        """
        self._order_by_clauses.append(key(self._model))
        return self

    def order_by_desc(self, key: Callable[[type[ModelT]], Any]) -> "QueryBuilder[EntityT, ModelT]":
        """Add descending sort order.

        Args:
            key: Lambda that returns column to sort by descending

        Returns:
            Self for method chaining

        Example:
            .order_by_desc(lambda x: x.created_at)
        """
        self._order_by_clauses.append(key(self._model).desc())
        return self

    def take(self, count: int) -> "QueryBuilder[EntityT, ModelT]":
        """Limit the number of results.

        Args:
            count: Maximum number of entities to return

        Returns:
            Self for method chaining

        Example:
            .take(10)
        """
        self._limit = count
        return self

    def skip(self, count: int) -> "QueryBuilder[EntityT, ModelT]":
        """Skip a number of results (for pagination).

        Args:
            count: Number of entities to skip

        Returns:
            Self for method chaining

        Example:
            .skip(20).take(10)  # Page 3 with 10 items per page
        """
        self._offset = count
        return self

    async def first(self) -> EntityT | None:
        """Execute query and return first matching entity.

        Returns:
            First matching entity, or None if no match

        Example:
            user = await repo.query().where(lambda x: x.email == email).first()
        """
        models = await self._execute(limit=1)
        return models[0] if models else None

    async def first_or_default(self, default: EntityT | None = None) -> EntityT | None:
        """Execute query and return first match or default value.

        Args:
            default: Value to return if no match found

        Returns:
            First matching entity, or default
        """
        result = await self.first()
        return result if result is not None else default

    async def single(self) -> EntityT:
        """Execute query and return exactly one result.

        Returns:
            The single matching entity

        Raises:
            ValueError: If no results or more than one result
        """
        models = await self._execute(limit=2)
        if len(models) == 0:
            raise ValueError("Sequence contains no elements")
        if len(models) > 1:
            raise ValueError("Sequence contains more than one element")
        return models[0]

    async def single_or_default(self, default: EntityT | None = None) -> EntityT | None:
        """Execute query and return single result or default.

        Args:
            default: Value to return if no match found

        Returns:
            The single matching entity, or default

        Raises:
            ValueError: If more than one result
        """
        models = await self._execute(limit=2)
        if len(models) == 0:
            return default
        if len(models) > 1:
            raise ValueError("Sequence contains more than one element")
        return models[0]

    async def to_list(self) -> list[EntityT]:
        """Execute query and return all matching entities.

        Returns:
            List of matching entities

        Example:
            products = await repo.query() \\
                .where(lambda x: x.price > 100) \\
                .order_by_desc(lambda x: x.created_at) \\
                .to_list()
        """
        return await self._execute()

    async def any(self) -> bool:
        """Check if any entities match the query.

        Returns:
            True if at least one entity matches

        Example:
            exists = await repo.query().where(lambda x: x.email == email).any()
        """
        stmt = self._build_count_statement()
        result = await self._session.execute(stmt)
        count = result.scalar_one()
        return count > 0

    async def count(self) -> int:
        """Count matching entities.

        Returns:
            Number of matching entities

        Example:
            total = await repo.query().where(lambda x: x.is_active == True).count()
        """
        stmt = self._build_count_statement()
        result = await self._session.execute(stmt)
        return result.scalar_one()

    def _build_statement(self) -> Select:
        """Build the SQLAlchemy select statement."""
        stmt = select(self._model)

        for filter_clause in self._filters:
            stmt = stmt.where(filter_clause)

        for order_clause in self._order_by_clauses:
            stmt = stmt.order_by(order_clause)

        if self._offset > 0:
            stmt = stmt.offset(self._offset)

        if self._limit is not None:
            stmt = stmt.limit(self._limit)

        return stmt

    def _build_count_statement(self) -> Select:
        """Build a count statement with filters applied."""
        stmt = select(func.count()).select_from(self._model)

        for filter_clause in self._filters:
            stmt = stmt.where(filter_clause)

        return stmt

    async def _execute(self, limit: int | None = None) -> list[EntityT]:
        """Execute the query and convert results to entities.

        Args:
            limit: Optional limit override

        Returns:
            List of domain entities
        """
        stmt = self._build_statement()

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]
