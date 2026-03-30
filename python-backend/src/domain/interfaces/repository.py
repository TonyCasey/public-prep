"""Base repository interface.

Defines the generic repository pattern for domain entities.
"""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar

T = TypeVar("T")
ID = TypeVar("ID")


class IRepository(ABC, Generic[T, ID]):
    """Base repository interface for CRUD operations.

    Generic repository providing standard CRUD operations.
    Concrete implementations should inherit from this interface.

    Type Parameters:
        T: Entity type
        ID: Entity identifier type
    """

    @abstractmethod
    async def get_by_id(self, entity_id: ID) -> T | None:
        """Retrieve an entity by its unique identifier.

        Args:
            entity_id: The entity's unique identifier

        Returns:
            The entity if found, None otherwise
        """
        ...

    @abstractmethod
    async def get_all(self, limit: int | None = None, offset: int = 0) -> list[T]:
        """Retrieve all entities with optional pagination.

        Args:
            limit: Maximum number of entities to return
            offset: Number of entities to skip

        Returns:
            List of entities
        """
        ...

    @abstractmethod
    async def save(self, entity: T) -> T:
        """Persist an entity (create or update).

        Args:
            entity: The entity to save

        Returns:
            The saved entity (may include generated fields)
        """
        ...

    @abstractmethod
    async def delete(self, entity_id: ID) -> bool:
        """Delete an entity by its identifier.

        Args:
            entity_id: The entity's unique identifier

        Returns:
            True if entity was deleted, False if not found
        """
        ...

    @abstractmethod
    async def exists(self, entity_id: ID) -> bool:
        """Check if an entity exists.

        Args:
            entity_id: The entity's unique identifier

        Returns:
            True if entity exists, False otherwise
        """
        ...

    @abstractmethod
    async def count(self) -> int:
        """Count total number of entities.

        Returns:
            Total count of entities
        """
        ...
