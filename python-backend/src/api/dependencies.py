"""FastAPI dependencies for dependency injection.

Provides reusable dependencies for routes including database sessions,
current user, and service instances.
"""

from collections.abc import AsyncGenerator
from typing import Annotated, Any

from dependency_injector.wiring import Provide, inject
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.di.container import Container


async def get_db_session(request: Request) -> AsyncGenerator[AsyncSession, None]:
    """Get database session from the DI container.

    This dependency provides an async database session that is automatically
    closed after the request completes.

    Usage:
        @router.get("/users")
        async def get_users(db: DbSession):
            result = await db.execute(select(User))
            return result.scalars().all()
    """
    container: Container = request.app.state.container
    db = container.db()

    async with db.session() as session:
        yield session


# Type alias for cleaner route signatures
DbSession = Annotated[AsyncSession, Depends(get_db_session)]


@inject
def get_settings_from_container(
    settings: Any = Provide[Container.settings],
) -> Any:
    """Get settings from DI container using injection."""
    return settings
