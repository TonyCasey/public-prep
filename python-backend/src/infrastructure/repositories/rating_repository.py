"""SQLAlchemy Rating repository implementation.

Implements IRatingRepository interface using SQLAlchemy async operations.
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities import Rating
from src.domain.interfaces import IRatingRepository
from src.infrastructure.database.models import Answer as AnswerModel
from src.infrastructure.database.models import Question as QuestionModel
from src.infrastructure.database.models import Rating as RatingModel

from .base import SQLAlchemyRepository


class RatingRepository(
    SQLAlchemyRepository[Rating, RatingModel, UUID], IRatingRepository
):
    """SQLAlchemy implementation of IRatingRepository.

    Provides rating-specific data access operations.
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize rating repository.

        Args:
            session: SQLAlchemy async session
        """
        super().__init__(session, RatingModel)

    def _to_entity(self, model: RatingModel) -> Rating:
        """Convert RatingModel to Rating entity.

        Args:
            model: SQLAlchemy RatingModel instance

        Returns:
            Rating domain entity
        """
        return Rating(
            id=model.id,
            answer_id=model.answer_id,
            overall_score=model.overall_score,
            competency_scores=model.competency_scores,
            star_method_analysis=model.star_method_analysis,
            feedback=model.feedback,
            strengths=model.strengths,
            improvement_areas=model.improvement_areas,
            ai_improved_answer=model.ai_improved_answer,
            evaluation=model.evaluation,
            rated_at=model.rated_at,
        )

    def _to_model(self, entity: Rating) -> RatingModel:
        """Convert Rating entity to RatingModel.

        Args:
            entity: Rating domain entity

        Returns:
            SQLAlchemy RatingModel instance
        """
        return RatingModel(
            id=entity.id,
            answer_id=entity.answer_id,
            overall_score=entity.overall_score,
            competency_scores=entity.competency_scores,
            star_method_analysis=entity.star_method_analysis,
            feedback=entity.feedback,
            strengths=entity.strengths,
            improvement_areas=entity.improvement_areas,
            ai_improved_answer=entity.ai_improved_answer,
            evaluation=entity.evaluation,
            rated_at=entity.rated_at,
        )

    def _update_model(self, model: RatingModel, entity: Rating) -> RatingModel:
        """Update existing RatingModel with entity data.

        Args:
            model: Existing SQLAlchemy RatingModel
            entity: Rating entity with updated data

        Returns:
            Updated RatingModel
        """
        model.answer_id = entity.answer_id
        model.overall_score = entity.overall_score
        model.competency_scores = entity.competency_scores
        model.star_method_analysis = entity.star_method_analysis
        model.feedback = entity.feedback
        model.strengths = entity.strengths
        model.improvement_areas = entity.improvement_areas
        model.ai_improved_answer = entity.ai_improved_answer
        model.evaluation = entity.evaluation
        model.rated_at = entity.rated_at
        return model

    async def get_by_answer(self, answer_id: UUID) -> Rating | None:
        """Find the rating for a specific answer.

        Args:
            answer_id: Answer's unique identifier

        Returns:
            Rating if exists, None otherwise
        """
        stmt = select(RatingModel).where(RatingModel.answer_id == answer_id)

        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._to_entity(model)

    async def get_by_interview(
        self,
        interview_id: UUID,
        limit: int | None = None,
    ) -> list[Rating]:
        """Find all ratings for answers in an interview.

        Args:
            interview_id: Interview's unique identifier
            limit: Maximum number of ratings to return

        Returns:
            List of ratings
        """
        stmt = (
            select(RatingModel)
            .join(AnswerModel, RatingModel.answer_id == AnswerModel.id)
            .where(AnswerModel.interview_id == interview_id)
            .order_by(RatingModel.rated_at)
        )

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

    async def get_average_score_by_interview(self, interview_id: UUID) -> Decimal | None:
        """Calculate average rating score for an interview.

        Args:
            interview_id: Interview's unique identifier

        Returns:
            Average score if ratings exist, None otherwise
        """
        stmt = (
            select(func.avg(RatingModel.overall_score))
            .join(AnswerModel, RatingModel.answer_id == AnswerModel.id)
            .where(AnswerModel.interview_id == interview_id)
        )

        result = await self._session.execute(stmt)
        avg = result.scalar_one()

        return Decimal(str(avg)) if avg is not None else None

    async def get_average_score_by_competency(
        self,
        user_id: str,
        competency: str,
    ) -> Decimal | None:
        """Calculate average score for a specific competency.

        Args:
            user_id: User's unique identifier
            competency: Competency to calculate for

        Returns:
            Average score if ratings exist, None otherwise
        """
        stmt = (
            select(func.avg(RatingModel.overall_score))
            .join(AnswerModel, RatingModel.answer_id == AnswerModel.id)
            .join(QuestionModel, AnswerModel.question_id == QuestionModel.id)
            .where(QuestionModel.user_id == user_id)
            .where(QuestionModel.competency == competency)
        )

        result = await self._session.execute(stmt)
        avg = result.scalar_one()

        return Decimal(str(avg)) if avg is not None else None

    async def get_scores_by_competency(
        self,
        user_id: str,
    ) -> dict[str, Decimal]:
        """Get average scores grouped by competency.

        Args:
            user_id: User's unique identifier

        Returns:
            Dictionary mapping competency to average score
        """
        stmt = (
            select(
                QuestionModel.competency,
                func.avg(RatingModel.overall_score).label("avg_score"),
            )
            .join(AnswerModel, RatingModel.answer_id == AnswerModel.id)
            .join(QuestionModel, AnswerModel.question_id == QuestionModel.id)
            .where(QuestionModel.user_id == user_id)
            .group_by(QuestionModel.competency)
        )

        result = await self._session.execute(stmt)
        rows = result.all()

        return {
            row.competency: Decimal(str(row.avg_score))
            for row in rows
            if row.avg_score is not None
        }

    async def get_recent_scores(
        self,
        user_id: str,
        limit: int = 10,
    ) -> list[Rating]:
        """Get most recent ratings for a user.

        Args:
            user_id: User's unique identifier
            limit: Maximum number of ratings to return

        Returns:
            List of recent ratings
        """
        stmt = (
            select(RatingModel)
            .join(AnswerModel, RatingModel.answer_id == AnswerModel.id)
            .join(QuestionModel, AnswerModel.question_id == QuestionModel.id)
            .where(QuestionModel.user_id == user_id)
            .order_by(RatingModel.rated_at.desc())
            .limit(limit)
        )

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

    async def has_rating_for_answer(self, answer_id: UUID) -> bool:
        """Check if an answer has been rated.

        Args:
            answer_id: Answer's unique identifier

        Returns:
            True if rated, False otherwise
        """
        stmt = (
            select(func.count())
            .select_from(RatingModel)
            .where(RatingModel.answer_id == answer_id)
        )

        result = await self._session.execute(stmt)
        count = result.scalar_one()

        return count > 0

    async def count_by_score_range(
        self,
        user_id: str,
        min_score: Decimal,
        max_score: Decimal,
    ) -> int:
        """Count ratings within a score range.

        Args:
            user_id: User's unique identifier
            min_score: Minimum score (inclusive)
            max_score: Maximum score (inclusive)

        Returns:
            Number of ratings in range
        """
        stmt = (
            select(func.count())
            .select_from(RatingModel)
            .join(AnswerModel, RatingModel.answer_id == AnswerModel.id)
            .join(QuestionModel, AnswerModel.question_id == QuestionModel.id)
            .where(QuestionModel.user_id == user_id)
            .where(RatingModel.overall_score >= min_score)
            .where(RatingModel.overall_score <= max_score)
        )

        result = await self._session.execute(stmt)
        return result.scalar_one()
