"""Interview service interface.

Defines the contract for interview operations.
"""

from abc import ABC, abstractmethod
from uuid import UUID

from src.domain.entities import Interview


class IInterviewService(ABC):
    """Interface for interview service.

    Defines interview management operations.
    """

    @abstractmethod
    async def get_user_interviews(self, user_id: str) -> list[Interview]:
        """Get all interviews for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            List of user's interviews
        """
        ...

    @abstractmethod
    async def get_interview(
        self,
        interview_id: UUID,
        requesting_user_id: str,
    ) -> Interview:
        """Get a specific interview.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            The requested interview

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview not found
        """
        ...

    @abstractmethod
    async def create_interview(
        self,
        user_id: str,
        session_type: str,
        total_questions: int,
        competency_focus: list[str] | None = None,
        job_title: str | None = None,
        job_grade: str = "eo",
        framework: str = "old",
    ) -> Interview:
        """Create a new interview.

        Deactivates any existing active interview for the user.

        Args:
            user_id: User's unique identifier
            session_type: Type of interview session
            total_questions: Total number of questions
            competency_focus: List of competencies to focus on
            job_title: Target job title
            job_grade: Target civil service grade
            framework: Competency framework version

        Returns:
            The created interview
        """
        ...

    @abstractmethod
    async def update_interview(
        self,
        interview_id: UUID,
        requesting_user_id: str,
        **updates,
    ) -> Interview:
        """Update an interview.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the user making the request
            **updates: Fields to update

        Returns:
            The updated interview

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview not found
        """
        ...

    @abstractmethod
    async def delete_interview(
        self,
        interview_id: UUID,
        requesting_user_id: str,
    ) -> bool:
        """Delete an interview.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            True if deleted successfully

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview not found
        """
        ...

    @abstractmethod
    async def export_interview(
        self,
        interview_id: UUID,
        requesting_user_id: str,
    ) -> dict:
        """Export interview report.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            Interview report data

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview not found
        """
        ...
