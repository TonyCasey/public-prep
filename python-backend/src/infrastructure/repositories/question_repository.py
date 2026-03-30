"""SQLAlchemy Question repository implementation.

Implements IQuestionRepository interface using SQLAlchemy async operations.
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities import Question
from src.domain.interfaces import IQuestionRepository
from src.domain.value_objects import Difficulty
from src.infrastructure.database.models import Question as QuestionModel

from .base import SQLAlchemyRepository


class QuestionRepository(
    SQLAlchemyRepository[Question, QuestionModel, UUID], IQuestionRepository
):
    """SQLAlchemy implementation of IQuestionRepository.

    Provides question-specific data access operations.
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize question repository.

        Args:
            session: SQLAlchemy async session
        """
        super().__init__(session, QuestionModel)

    def _to_entity(self, model: QuestionModel) -> Question:
        """Convert QuestionModel to Question entity.

        Args:
            model: SQLAlchemy QuestionModel instance

        Returns:
            Question domain entity
        """
        return Question(
            id=model.id,
            user_id=model.user_id,
            interview_id=model.interview_id,
            competency=model.competency,
            question_text=model.question_text,
            difficulty=Difficulty(model.difficulty),
            generated_at=model.generated_at,
        )

    def _to_model(self, entity: Question) -> QuestionModel:
        """Convert Question entity to QuestionModel.

        Args:
            entity: Question domain entity

        Returns:
            SQLAlchemy QuestionModel instance
        """
        return QuestionModel(
            id=entity.id,
            user_id=entity.user_id,
            interview_id=entity.interview_id,
            competency=entity.competency,
            question_text=entity.question_text,
            difficulty=entity.difficulty.value,
            generated_at=entity.generated_at,
        )

    def _update_model(self, model: QuestionModel, entity: Question) -> QuestionModel:
        """Update existing QuestionModel with entity data.

        Args:
            model: Existing SQLAlchemy QuestionModel
            entity: Question entity with updated data

        Returns:
            Updated QuestionModel
        """
        model.user_id = entity.user_id
        model.interview_id = entity.interview_id
        model.competency = entity.competency
        model.question_text = entity.question_text
        model.difficulty = entity.difficulty.value
        model.generated_at = entity.generated_at
        return model

    async def get_by_interview(
        self,
        interview_id: UUID,
        limit: int | None = None,
    ) -> list[Question]:
        """Find all questions for a specific interview.

        Args:
            interview_id: Interview's unique identifier
            limit: Maximum number of questions to return

        Returns:
            List of interview questions
        """
        stmt = (
            select(QuestionModel)
            .where(QuestionModel.interview_id == interview_id)
            .order_by(QuestionModel.generated_at)
        )

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

    async def get_by_user(
        self,
        user_id: str,
        limit: int | None = None,
    ) -> list[Question]:
        """Find all questions for a specific user.

        Args:
            user_id: User's unique identifier
            limit: Maximum number of questions to return

        Returns:
            List of user's questions
        """
        stmt = (
            select(QuestionModel)
            .where(QuestionModel.user_id == user_id)
            .order_by(QuestionModel.generated_at.desc())
        )

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

    async def get_by_competency(
        self,
        competency: str,
        user_id: str | None = None,
        limit: int | None = None,
    ) -> list[Question]:
        """Find questions by competency.

        Args:
            competency: Competency to filter by
            user_id: Optional user filter
            limit: Maximum number of questions to return

        Returns:
            List of questions for the competency
        """
        stmt = select(QuestionModel).where(QuestionModel.competency == competency)

        if user_id is not None:
            stmt = stmt.where(QuestionModel.user_id == user_id)

        stmt = stmt.order_by(QuestionModel.generated_at.desc())

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

    async def get_by_difficulty(
        self,
        difficulty: Difficulty,
        user_id: str | None = None,
        limit: int | None = None,
    ) -> list[Question]:
        """Find questions by difficulty level.

        Args:
            difficulty: Difficulty level to filter by
            user_id: Optional user filter
            limit: Maximum number of questions to return

        Returns:
            List of questions at that difficulty
        """
        stmt = select(QuestionModel).where(
            QuestionModel.difficulty == difficulty.value
        )

        if user_id is not None:
            stmt = stmt.where(QuestionModel.user_id == user_id)

        stmt = stmt.order_by(QuestionModel.generated_at.desc())

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

    async def get_question_at_index(
        self,
        interview_id: UUID,
        index: int,
    ) -> Question | None:
        """Get a specific question by its index in an interview.

        Args:
            interview_id: Interview's unique identifier
            index: Question index (0-based)

        Returns:
            Question at that index if exists, None otherwise
        """
        stmt = (
            select(QuestionModel)
            .where(QuestionModel.interview_id == interview_id)
            .order_by(QuestionModel.generated_at)
            .offset(index)
            .limit(1)
        )

        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._to_entity(model)

    async def count_by_interview(self, interview_id: UUID) -> int:
        """Count questions in an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Number of questions
        """
        stmt = (
            select(func.count())
            .select_from(QuestionModel)
            .where(QuestionModel.interview_id == interview_id)
        )

        result = await self._session.execute(stmt)
        return result.scalar_one()

    async def count_by_competency(
        self,
        competency: str,
        user_id: str | None = None,
    ) -> int:
        """Count questions for a competency.

        Args:
            competency: Competency to count
            user_id: Optional user filter

        Returns:
            Number of questions
        """
        stmt = (
            select(func.count())
            .select_from(QuestionModel)
            .where(QuestionModel.competency == competency)
        )

        if user_id is not None:
            stmt = stmt.where(QuestionModel.user_id == user_id)

        result = await self._session.execute(stmt)
        return result.scalar_one()
