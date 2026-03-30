"""SQLAlchemy Answer repository implementation.

Implements IAnswerRepository interface using SQLAlchemy async operations.
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities import Answer
from src.domain.interfaces import IAnswerRepository
from src.infrastructure.database.models import Answer as AnswerModel

from .base import SQLAlchemyRepository


class AnswerRepository(
    SQLAlchemyRepository[Answer, AnswerModel, UUID], IAnswerRepository
):
    """SQLAlchemy implementation of IAnswerRepository.

    Provides answer-specific data access operations.
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize answer repository.

        Args:
            session: SQLAlchemy async session
        """
        super().__init__(session, AnswerModel)

    def _to_entity(self, model: AnswerModel) -> Answer:
        """Convert AnswerModel to Answer entity.

        Args:
            model: SQLAlchemy AnswerModel instance

        Returns:
            Answer domain entity
        """
        return Answer(
            id=model.id,
            interview_id=model.interview_id,
            question_id=model.question_id,
            answer_text=model.answer_text,
            time_spent=model.time_spent,
            answered_at=model.answered_at,
        )

    def _to_model(self, entity: Answer) -> AnswerModel:
        """Convert Answer entity to AnswerModel.

        Args:
            entity: Answer domain entity

        Returns:
            SQLAlchemy AnswerModel instance
        """
        return AnswerModel(
            id=entity.id,
            interview_id=entity.interview_id,
            question_id=entity.question_id,
            answer_text=entity.answer_text,
            time_spent=entity.time_spent,
            answered_at=entity.answered_at,
        )

    def _update_model(self, model: AnswerModel, entity: Answer) -> AnswerModel:
        """Update existing AnswerModel with entity data.

        Args:
            model: Existing SQLAlchemy AnswerModel
            entity: Answer entity with updated data

        Returns:
            Updated AnswerModel
        """
        model.interview_id = entity.interview_id
        model.question_id = entity.question_id
        model.answer_text = entity.answer_text
        model.time_spent = entity.time_spent
        model.answered_at = entity.answered_at
        return model

    async def get_by_interview(
        self,
        interview_id: UUID,
        limit: int | None = None,
    ) -> list[Answer]:
        """Find all answers for a specific interview.

        Args:
            interview_id: Interview's unique identifier
            limit: Maximum number of answers to return

        Returns:
            List of interview answers
        """
        stmt = (
            select(AnswerModel)
            .where(AnswerModel.interview_id == interview_id)
            .order_by(AnswerModel.answered_at)
        )

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

    async def get_by_question(self, question_id: UUID) -> Answer | None:
        """Find the answer for a specific question.

        Args:
            question_id: Question's unique identifier

        Returns:
            Answer if exists, None otherwise
        """
        stmt = select(AnswerModel).where(AnswerModel.question_id == question_id)

        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._to_entity(model)

    async def get_latest_by_interview(self, interview_id: UUID) -> Answer | None:
        """Get the most recent answer in an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Latest answer if exists, None otherwise
        """
        stmt = (
            select(AnswerModel)
            .where(AnswerModel.interview_id == interview_id)
            .order_by(AnswerModel.answered_at.desc())
            .limit(1)
        )

        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._to_entity(model)

    async def count_by_interview(self, interview_id: UUID) -> int:
        """Count answers in an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Number of answers
        """
        stmt = (
            select(func.count())
            .select_from(AnswerModel)
            .where(AnswerModel.interview_id == interview_id)
        )

        result = await self._session.execute(stmt)
        return result.scalar_one()

    async def get_total_time_spent(self, interview_id: UUID) -> int:
        """Calculate total time spent on all answers in an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Total time in seconds
        """
        stmt = (
            select(func.coalesce(func.sum(AnswerModel.time_spent), 0))
            .where(AnswerModel.interview_id == interview_id)
        )

        result = await self._session.execute(stmt)
        return result.scalar_one()

    async def get_average_time_spent(self, interview_id: UUID) -> float | None:
        """Calculate average time spent per answer in an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Average time in seconds if answers exist, None otherwise
        """
        stmt = (
            select(func.avg(AnswerModel.time_spent))
            .where(AnswerModel.interview_id == interview_id)
            .where(AnswerModel.time_spent.isnot(None))
        )

        result = await self._session.execute(stmt)
        avg = result.scalar_one()

        return float(avg) if avg is not None else None

    async def has_answer_for_question(self, question_id: UUID) -> bool:
        """Check if a question has been answered.

        Args:
            question_id: Question's unique identifier

        Returns:
            True if answered, False otherwise
        """
        stmt = (
            select(func.count())
            .select_from(AnswerModel)
            .where(AnswerModel.question_id == question_id)
        )

        result = await self._session.execute(stmt)
        count = result.scalar_one()

        return count > 0
