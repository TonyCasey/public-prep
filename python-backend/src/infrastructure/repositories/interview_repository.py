"""SQLAlchemy Interview repository implementation.

Implements IInterviewRepository interface using SQLAlchemy async operations.
"""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities import Interview
from src.domain.interfaces import IInterviewRepository
from src.domain.value_objects import Framework, Grade, SessionType
from src.infrastructure.database.models import Interview as InterviewModel

from .base import SQLAlchemyRepository


class InterviewRepository(
    SQLAlchemyRepository[Interview, InterviewModel, UUID], IInterviewRepository
):
    """SQLAlchemy implementation of IInterviewRepository.

    Provides interview-specific data access operations.
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize interview repository.

        Args:
            session: SQLAlchemy async session
        """
        super().__init__(session, InterviewModel)

    def _to_entity(self, model: InterviewModel) -> Interview:
        """Convert InterviewModel to Interview entity.

        Args:
            model: SQLAlchemy InterviewModel instance

        Returns:
            Interview domain entity
        """
        return Interview(
            id=model.id,
            user_id=model.user_id,
            session_type=SessionType(model.session_type),
            competency_focus=model.competency_focus,
            job_title=model.job_title,
            job_grade=Grade(model.job_grade or "eo"),
            framework=Framework(model.framework or "old"),
            total_questions=model.total_questions,
            current_question_index=model.current_question_index or 0,
            completed_questions=model.completed_questions or 0,
            average_score=model.average_score,
            duration=model.duration,
            started_at=model.started_at,
            completed_at=model.completed_at,
            is_active=model.is_active if model.is_active is not None else True,
        )

    def _to_model(self, entity: Interview) -> InterviewModel:
        """Convert Interview entity to InterviewModel.

        Args:
            entity: Interview domain entity

        Returns:
            SQLAlchemy InterviewModel instance
        """
        return InterviewModel(
            id=entity.id,
            user_id=entity.user_id,
            session_type=entity.session_type.value,
            competency_focus=entity.competency_focus,
            job_title=entity.job_title,
            job_grade=entity.job_grade.value,
            framework=entity.framework.value,
            total_questions=entity.total_questions,
            current_question_index=entity.current_question_index,
            completed_questions=entity.completed_questions,
            average_score=entity.average_score,
            duration=entity.duration,
            started_at=entity.started_at,
            completed_at=entity.completed_at,
            is_active=entity.is_active,
        )

    def _update_model(self, model: InterviewModel, entity: Interview) -> InterviewModel:
        """Update existing InterviewModel with entity data.

        Args:
            model: Existing SQLAlchemy InterviewModel
            entity: Interview entity with updated data

        Returns:
            Updated InterviewModel
        """
        model.user_id = entity.user_id
        model.session_type = entity.session_type.value
        model.competency_focus = entity.competency_focus
        model.job_title = entity.job_title
        model.job_grade = entity.job_grade.value
        model.framework = entity.framework.value
        model.total_questions = entity.total_questions
        model.current_question_index = entity.current_question_index
        model.completed_questions = entity.completed_questions
        model.average_score = entity.average_score
        model.duration = entity.duration
        model.started_at = entity.started_at
        model.completed_at = entity.completed_at
        model.is_active = entity.is_active
        return model

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
        stmt = select(InterviewModel).where(InterviewModel.user_id == user_id)

        if not include_completed:
            stmt = stmt.where(InterviewModel.is_active == True)

        stmt = stmt.order_by(InterviewModel.started_at.desc())

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

    async def get_active_by_user(self, user_id: str) -> Interview | None:
        """Find the active (in-progress) interview for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            Active interview if exists, None otherwise
        """
        stmt = (
            select(InterviewModel)
            .where(InterviewModel.user_id == user_id)
            .where(InterviewModel.is_active == True)
            .order_by(InterviewModel.started_at.desc())
            .limit(1)
        )

        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._to_entity(model)

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
        stmt = select(InterviewModel).where(
            InterviewModel.session_type == session_type.value
        )

        if user_id is not None:
            stmt = stmt.where(InterviewModel.user_id == user_id)

        stmt = stmt.order_by(InterviewModel.started_at.desc())

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

    async def get_completed_count(self, user_id: str) -> int:
        """Count completed interviews for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            Number of completed interviews
        """
        stmt = (
            select(func.count())
            .select_from(InterviewModel)
            .where(InterviewModel.user_id == user_id)
            .where(InterviewModel.is_active == False)
        )

        result = await self._session.execute(stmt)
        return result.scalar_one()

    async def get_average_score(self, user_id: str) -> float | None:
        """Calculate average score across all completed interviews.

        Args:
            user_id: User's unique identifier

        Returns:
            Average score if interviews exist, None otherwise
        """
        stmt = (
            select(func.avg(InterviewModel.average_score))
            .where(InterviewModel.user_id == user_id)
            .where(InterviewModel.is_active == False)
            .where(InterviewModel.average_score.isnot(None))
        )

        result = await self._session.execute(stmt)
        avg = result.scalar_one()

        return float(avg) if avg is not None else None

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
        model = await self._get_model_by_id(interview_id)
        if model is None:
            return None

        model.is_active = False
        model.completed_at = datetime.now(UTC)

        if average_score is not None:
            model.average_score = average_score

        if duration is not None:
            model.duration = duration

        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

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
        stmt = (
            select(InterviewModel)
            .where(InterviewModel.user_id == user_id)
            .where(InterviewModel.started_at >= start_date)
            .where(InterviewModel.started_at <= end_date)
            .order_by(InterviewModel.started_at.desc())
        )

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]
