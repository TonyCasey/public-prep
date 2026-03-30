"""Interview repository interface.

Defines data access operations for Interview entities.
"""

from abc import abstractmethod
from datetime import datetime
from uuid import UUID

from src.domain.entities import Interview
from src.domain.value_objects import SessionType

from .repository import IRepository


class IInterviewRepository(IRepository[Interview, UUID]):
    """Repository interface for Interview entities.

    Extends base repository with interview-specific query methods.
    """

    @abstractmethod
    async def get_by_user(
        self,
        user_id: str,
        limit: int | None = None,
        include_completed: bool = True,
    ) -> list[Interview]:
        """Find all interviews for a specific user.

        Args:
            user_id: User's unique identifier
            limit: Maximum number of interviews to return
            include_completed: Whether to include completed interviews

        Returns:
            List of user's interviews
        """
        ...

    @abstractmethod
    async def get_active_by_user(self, user_id: str) -> Interview | None:
        """Find the active (in-progress) interview for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            Active interview if exists, None otherwise
        """
        ...

    @abstractmethod
    async def get_by_session_type(
        self,
        session_type: SessionType,
        user_id: str | None = None,
        limit: int | None = None,
    ) -> list[Interview]:
        """Find interviews by session type.

        Args:
            session_type: Type of interview session
            user_id: Optional user filter
            limit: Maximum number of interviews to return

        Returns:
            List of matching interviews
        """
        ...

    @abstractmethod
    async def get_completed_count(self, user_id: str) -> int:
        """Count completed interviews for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            Number of completed interviews
        """
        ...

    @abstractmethod
    async def get_average_score(self, user_id: str) -> float | None:
        """Calculate average score across all completed interviews.

        Args:
            user_id: User's unique identifier

        Returns:
            Average score if interviews exist, None otherwise
        """
        ...

    @abstractmethod
    async def complete_interview(
        self,
        interview_id: UUID,
        average_score: int | None = None,
        duration: int | None = None,
    ) -> Interview | None:
        """Mark an interview as completed.

        Args:
            interview_id: Interview's unique identifier
            average_score: Final average score
            duration: Total duration in minutes

        Returns:
            Updated interview if found, None otherwise
        """
        ...

    @abstractmethod
    async def get_interviews_in_date_range(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime,
    ) -> list[Interview]:
        """Find interviews within a date range.

        Args:
            user_id: User's unique identifier
            start_date: Start of date range
            end_date: End of date range

        Returns:
            List of interviews in the date range
        """
        ...
