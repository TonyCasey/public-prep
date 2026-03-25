"""Repository implementations module.

Provides SQLAlchemy-based repository implementations for data access.
"""

from .base import PaginatedResult, SQLAlchemyRepository
from .user_repository import UserRepository

__all__ = [
    "PaginatedResult",
    "SQLAlchemyRepository",
    "UserRepository",
]
