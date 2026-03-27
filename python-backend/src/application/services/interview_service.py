"""Interview service implementation.

Handles interview session management and business logic.
"""

import logging
from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.interfaces.interview_service import IInterviewService
from src.domain.entities import Interview
from src.domain.interfaces import IAnswerRepository, IInterviewRepository, IUserRepository
from src.domain.value_objects import Framework, Grade, SessionType

logger = logging.getLogger(__name__)


class InterviewService(IInterviewService):
    """Interview service implementation.

    Provides interview management with authorization checks.
    """

    def __init__(
        self,
        interview_repository: IInterviewRepository,
        answer_repository: IAnswerRepository,
        user_repository: IUserRepository,
    ) -> None:
        """Initialize interview service.

        Args:
            interview_repository: Interview repository for data access
            answer_repository: Answer repository for answer queries
            user_repository: User repository for user data
        """
        self._interview_repo = interview_repository
        self._answer_repo = answer_repository
        self._user_repo = user_repository

    async def _check_ownership(
        self,
        interview: Interview,
        requesting_user_id: str,
    ) -> None:
        """Check if user owns the interview.

        Args:
            interview: The interview to check
            requesting_user_id: ID of the requesting user

        Raises:
            PermissionError: If user doesn't own the interview
        """
        if interview.user_id != requesting_user_id:
            logger.warning(
                f"Access denied: user {requesting_user_id} tried to access interview {interview.id}"
            )
            raise PermissionError("Access denied")

    async def get_user_interviews(self, user_id: str) -> list[Interview]:
        """Get all interviews for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            List of user's interviews ordered by start date (newest first)
        """
        return await self._interview_repo.get_by_user(user_id)

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
        interview = await self._interview_repo.get_by_id(interview_id)
        if interview is None:
            raise ValueError("Interview not found")

        await self._check_ownership(interview, requesting_user_id)
        return interview

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
        # Deactivate any existing active session
        active_interview = await self._interview_repo.get_active_by_user(user_id)
        if active_interview:
            active_interview.is_active = False
            await self._interview_repo.update(active_interview)
            logger.info(f"Deactivated previous interview {active_interview.id} for user {user_id}")

        # Create new interview
        interview = Interview(
            id=uuid4(),
            user_id=user_id,
            session_type=SessionType(session_type),
            total_questions=total_questions,
            competency_focus=competency_focus,
            job_title=job_title,
            job_grade=Grade(job_grade),
            framework=Framework(framework),
            current_question_index=0,
            completed_questions=0,
            is_active=True,
            started_at=datetime.now(UTC),
        )

        created = await self._interview_repo.create(interview)
        logger.info(f"Created interview {created.id} for user {user_id}")

        return created

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
        interview = await self._interview_repo.get_by_id(interview_id)
        if interview is None:
            raise ValueError("Interview not found")

        await self._check_ownership(interview, requesting_user_id)

        # Apply updates
        for key, value in updates.items():
            if value is not None and hasattr(interview, key):
                setattr(interview, key, value)

        updated = await self._interview_repo.update(interview)
        logger.info(f"Updated interview {interview_id}")

        return updated

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
        interview = await self._interview_repo.get_by_id(interview_id)
        if interview is None:
            raise ValueError("Interview not found")

        await self._check_ownership(interview, requesting_user_id)

        result = await self._interview_repo.delete(interview_id)
        if result:
            logger.info(f"Deleted interview {interview_id}")

        return result

    async def get_interview_answers(
        self,
        interview_id: UUID,
        requesting_user_id: str,
    ) -> list:
        """Get answers for an interview.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            List of answers

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview not found
        """
        interview = await self._interview_repo.get_by_id(interview_id)
        if interview is None:
            raise ValueError("Interview not found")

        await self._check_ownership(interview, requesting_user_id)

        return await self._answer_repo.get_by_interview(interview_id)

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
        interview = await self._interview_repo.get_by_id(interview_id)
        if interview is None:
            raise ValueError("Interview not found")

        await self._check_ownership(interview, requesting_user_id)

        # Get answer count
        answers = await self._answer_repo.get_by_interview(interview_id)
        answer_count = len(answers)

        # Get user info
        user = await self._user_repo.get_by_id(requesting_user_id)

        return {
            "interview": {
                "id": str(interview.id),
                "jobTitle": interview.job_title,
                "jobGrade": interview.job_grade.value,
                "framework": interview.framework.value,
                "startedAt": interview.started_at.isoformat() if interview.started_at else None,
                "completedAt": interview.completed_at.isoformat() if interview.completed_at else None,
                "averageScore": interview.average_score,
            },
            "user": {
                "email": user.email if user else None,
                "firstName": user.first_name if user else None,
                "lastName": user.last_name if user else None,
            },
            "answers": answer_count,
            "exportedAt": datetime.now(UTC).isoformat(),
        }
