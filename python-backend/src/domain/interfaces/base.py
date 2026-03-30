"""Base repository interface.

Defines the common CRUD operations that all repositories should support.
"""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar

T = TypeVar("T")
ID = TypeVar("ID")


class IRepository(ABC, Generic[T, ID]):
    """Base repository interface with standard CRUD operations.

    Type Parameters:
        T: The entity type this repository manages
        ID: The type of the entity's identifier
    """

    @abstractmethod
    async def get_by_id(self, entity_id: ID) -> T | None:
        """Retrieve an entity by its identifier.

        Args:
            entity_id: The unique identifier

        Returns:
            The entity if found, None otherwise
        """
        pass

    @abstractmethod
    async def get_all(self, limit: int = 100, offset: int = 0) -> list[T]:
        """Retrieve all entities with pagination.

        Args:
            limit: Maximum number of entities to return
            offset: Number of entities to skip

        Returns:
            List of entities
        """
        pass

    @abstractmethod
    async def create(self, entity: T) -> T:
        """Create a new entity.

        Args:
            entity: The entity to create

        Returns:
            The created entity with any generated fields populated
        """
        pass

    @abstractmethod
    async def update(self, entity: T) -> T:
        """Update an existing entity.

        Args:
            entity: The entity with updated values

        Returns:
            The updated entity
        """
        pass

    @abstractmethod
    async def delete(self, entity_id: ID) -> bool:
        """Delete an entity by its identifier.

        Args:
            entity_id: The unique identifier

        Returns:
            True if entity was deleted, False if not found
        """
        pass

    @abstractmethod
    async def exists(self, entity_id: ID) -> bool:
        """Check if an entity exists.

        Args:
            entity_id: The unique identifier

        Returns:
            True if entity exists, False otherwise
        """
        pass

    @abstractmethod
    async def count(self) -> int:
        """Get total count of entities.

        Returns:
            Total number of entities
        """
        pass
