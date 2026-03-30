"""Async database session configuration.

Provides async engine, session factory, and connection utilities for PostgreSQL.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from .models import Base


def create_database_url(url: str) -> str:
    """Convert standard PostgreSQL URL to async-compatible format.

    Handles conversion from:
    - postgres:// (Railway format) -> postgresql+asyncpg://
    - postgresql:// -> postgresql+asyncpg://
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def create_engine(
    database_url: str,
    *,
    pool_size: int = 5,
    max_overflow: int = 10,
    pool_pre_ping: bool = True,
    echo: bool = False,
) -> AsyncEngine:
    """Create an async SQLAlchemy engine with connection pooling.

    Args:
        database_url: PostgreSQL connection URL
        pool_size: Number of connections to keep in the pool
        max_overflow: Max connections that can be created beyond pool_size
        pool_pre_ping: Enable connection health checks before use
        echo: Log all SQL statements (for debugging)

    Returns:
        Configured AsyncEngine instance
    """
    url = create_database_url(database_url)

    return create_async_engine(
        url,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_pre_ping=pool_pre_ping,
        echo=echo,
    )


def create_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """Create an async session factory bound to the given engine.

    Args:
        engine: AsyncEngine to bind sessions to

    Returns:
        Session factory that creates AsyncSession instances
    """
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


class DatabaseSession:
    """Database session manager for dependency injection.

    Provides a clean interface for creating and managing async database sessions.
    Designed to be used with dependency-injector.
    """

    def __init__(
        self,
        database_url: str,
        *,
        pool_size: int = 5,
        max_overflow: int = 10,
        echo: bool = False,
    ) -> None:
        """Initialize the database session manager.

        Args:
            database_url: PostgreSQL connection URL
            pool_size: Number of connections to keep in the pool
            max_overflow: Max connections beyond pool_size
            echo: Log SQL statements
        """
        self._engine = create_engine(
            database_url,
            pool_size=pool_size,
            max_overflow=max_overflow,
            echo=echo,
        )
        self._session_factory = create_session_factory(self._engine)

    @property
    def engine(self) -> AsyncEngine:
        """Get the underlying async engine."""
        return self._engine

    @property
    def session_factory(self) -> async_sessionmaker[AsyncSession]:
        """Get the session factory."""
        return self._session_factory

    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """Create a new database session with automatic cleanup.

        Usage:
            async with db.session() as session:
                result = await session.execute(query)
                await session.commit()

        Yields:
            AsyncSession instance

        Raises:
            Any database exception after rollback
        """
        session = self._session_factory()
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    async def close(self) -> None:
        """Close the engine and dispose of all connections."""
        await self._engine.dispose()


async def get_session(
    session_factory: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI route injection.

    Usage in FastAPI:
        @router.get("/users")
        async def get_users(session: AsyncSession = Depends(get_session)):
            ...

    Yields:
        AsyncSession instance with automatic cleanup
    """
    async with session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


# Re-export Base for Alembic
__all__ = [
    "Base",
    "DatabaseSession",
    "create_database_url",
    "create_engine",
    "create_session_factory",
    "get_session",
]
