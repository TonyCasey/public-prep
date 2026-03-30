"""Rating service implementation.

Handles rating management and business logic.
"""

import logging
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from src.application.interfaces.rating_service import IRatingService
from src.domain.entities import Rating
from src.domain.interfaces import IAnswerRepository, IInterviewRepository, IRatingRepository

logger = logging.getLogger(__name__)


class RatingService(IRatingService):
    """Rating service implementation.

    Provides rating management with authorization checks.
    """

    def __init__(
        self,
        rating_repository: IRatingRepository,
        answer_repository: IAnswerRepository,
        interview_repository: IInterviewRepository,
    ) -> None:
        """Initialize rating service.

        Args:
            rating_repository: Rating repository for data access
            answer_repository: Answer repository for validation
            interview_repository: Interview repository for ownership checks
        """
        self._rating_repo = rating_repository
        self._answer_repo = answer_repository
        self._interview_repo = interview_repository

    async def _verify_interview_ownership(
        self,
        interview_id: UUID,
        requesting_user_id: str,
    ) -> None:
        """Verify user owns the interview.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the requesting user

        Raises:
            ValueError: If interview not found
            PermissionError: If user doesn't own the interview
        """
        interview = await self._interview_repo.get_by_id(interview_id)
        if interview is None:
            raise ValueError("Interview not found")
        if interview.user_id != requesting_user_id:
            logger.warning(
                f"Access denied: user {requesting_user_id} tried to access interview {interview_id}"
            )
            raise PermissionError("Access denied")

    async def _verify_answer_ownership(
        self,
        answer_id: UUID,
        requesting_user_id: str,
    ) -> None:
        """Verify user owns the answer via interview ownership.

        Args:
            answer_id: Answer's unique identifier
            requesting_user_id: ID of the requesting user

        Raises:
            ValueError: If answer not found
            PermissionError: If user doesn't own the answer
        """
        answer = await self._answer_repo.get_by_id(answer_id)
        if answer is None:
            raise ValueError("Answer not found")

        if answer.interview_id:
            await self._verify_interview_ownership(answer.interview_id, requesting_user_id)
        else:
            logger.warning(
                f"Access denied: user {requesting_user_id} tried to access answer {answer_id} with no interview"
            )
            raise PermissionError("Access denied")

    async def _verify_rating_ownership(
        self,
        rating: Rating,
        requesting_user_id: str,
    ) -> None:
        """Verify user owns the rating via answer/interview ownership.

        Args:
            rating: The rating to check
            requesting_user_id: ID of the requesting user

        Raises:
            ValueError: If associated answer not found
            PermissionError: If user doesn't own the rating
        """
        if rating.answer_id:
            await self._verify_answer_ownership(rating.answer_id, requesting_user_id)
        else:
            logger.warning(
                f"Access denied: user {requesting_user_id} tried to access rating {rating.id} with no answer"
            )
            raise PermissionError("Access denied")

    async def get_ratings_by_interview(
        self,
        interview_id: UUID,
        requesting_user_id: str,
    ) -> list[Rating]:
        """Get all ratings for an interview.

        Args:
            interview_id: Interview's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            List of ratings

        Raises:
            PermissionError: If user doesn't own the interview
            ValueError: If interview not found
        """
        await self._verify_interview_ownership(interview_id, requesting_user_id)
        return await self._rating_repo.get_by_interview(interview_id)

    async def get_rating_by_answer(
        self,
        answer_id: UUID,
        requesting_user_id: str,
    ) -> Rating:
        """Get rating for a specific answer.

        Args:
            answer_id: Answer's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            The rating for the answer

        Raises:
            PermissionError: If user doesn't own the answer
            ValueError: If rating or answer not found
        """
        await self._verify_answer_ownership(answer_id, requesting_user_id)

        rating = await self._rating_repo.get_by_answer(answer_id)
        if rating is None:
            raise ValueError("Rating not found")

        return rating

    async def get_rating(
        self,
        rating_id: UUID,
        requesting_user_id: str,
    ) -> Rating:
        """Get a specific rating by ID.

        Args:
            rating_id: Rating's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            The requested rating

        Raises:
            PermissionError: If user doesn't own the rating
            ValueError: If rating not found
        """
        rating = await self._rating_repo.get_by_id(rating_id)
        if rating is None:
            raise ValueError("Rating not found")

        await self._verify_rating_ownership(rating, requesting_user_id)
        return rating

    async def create_rating(
        self,
        answer_id: UUID,
        overall_score: Decimal,
        requesting_user_id: str,
        competency_scores: dict[str, Any] | None = None,
        star_method_analysis: dict[str, Any] | None = None,
        feedback: str | None = None,
        strengths: list[str] | None = None,
        improvement_areas: list[str] | None = None,
        ai_improved_answer: str | None = None,
    ) -> Rating:
        """Create a new rating for an answer.

        Args:
            answer_id: Answer being rated
            overall_score: Overall score (0-10)
            requesting_user_id: ID of the user making the request
            competency_scores: Scores by competency
            star_method_analysis: STAR method breakdown
            feedback: AI feedback text
            strengths: List of identified strengths
            improvement_areas: List of areas to improve
            ai_improved_answer: AI-suggested improved answer

        Returns:
            The created rating

        Raises:
            PermissionError: If user doesn't own the answer
            ValueError: If answer not found or rating already exists
        """
        await self._verify_answer_ownership(answer_id, requesting_user_id)

        # Check if rating already exists
        existing = await self._rating_repo.get_by_answer(answer_id)
        if existing:
            raise ValueError("Rating already exists for this answer")

        # Build evaluation dict for storage
        evaluation = {
            "overallScore": float(overall_score),
            "starMethodAnalysis": star_method_analysis,
            "strengths": strengths,
            "improvementAreas": improvement_areas,
            "feedback": feedback,
            "aiImprovedAnswer": ai_improved_answer,
        }

        rating = Rating(
            id=uuid4(),
            answer_id=answer_id,
            overall_score=overall_score,
            competency_scores=competency_scores,
            star_method_analysis=star_method_analysis,
            feedback=feedback,
            strengths=strengths,
            improvement_areas=improvement_areas,
            ai_improved_answer=ai_improved_answer,
            evaluation=evaluation,
            rated_at=datetime.now(UTC),
        )

        created = await self._rating_repo.create(rating)
        logger.info(f"Created rating {created.id} for answer {answer_id}")

        return created

    async def update_rating(
        self,
        rating_id: UUID,
        requesting_user_id: str,
        overall_score: Decimal | None = None,
        competency_scores: dict[str, Any] | None = None,
        star_method_analysis: dict[str, Any] | None = None,
        feedback: str | None = None,
        strengths: list[str] | None = None,
        improvement_areas: list[str] | None = None,
        ai_improved_answer: str | None = None,
    ) -> Rating:
        """Update an existing rating.

        Args:
            rating_id: Rating's unique identifier
            requesting_user_id: ID of the user making the request
            overall_score: New overall score
            competency_scores: Updated competency scores
            star_method_analysis: Updated STAR analysis
            feedback: Updated feedback
            strengths: Updated strengths
            improvement_areas: Updated improvement areas
            ai_improved_answer: Updated improved answer

        Returns:
            The updated rating

        Raises:
            PermissionError: If user doesn't own the rating
            ValueError: If rating not found
        """
        rating = await self._rating_repo.get_by_id(rating_id)
        if rating is None:
            raise ValueError("Rating not found")

        await self._verify_rating_ownership(rating, requesting_user_id)

        # Apply updates
        if overall_score is not None:
            rating.overall_score = overall_score
        if competency_scores is not None:
            rating.competency_scores = competency_scores
        if star_method_analysis is not None:
            rating.star_method_analysis = star_method_analysis
        if feedback is not None:
            rating.feedback = feedback
        if strengths is not None:
            rating.strengths = strengths
        if improvement_areas is not None:
            rating.improvement_areas = improvement_areas
        if ai_improved_answer is not None:
            rating.ai_improved_answer = ai_improved_answer

        updated = await self._rating_repo.update(rating)
        logger.info(f"Updated rating {rating_id}")

        return updated

    async def delete_rating(
        self,
        rating_id: UUID,
        requesting_user_id: str,
    ) -> bool:
        """Delete a rating.

        Args:
            rating_id: Rating's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            True if deleted successfully

        Raises:
            PermissionError: If user doesn't own the rating
            ValueError: If rating not found
        """
        rating = await self._rating_repo.get_by_id(rating_id)
        if rating is None:
            raise ValueError("Rating not found")

        await self._verify_rating_ownership(rating, requesting_user_id)

        result = await self._rating_repo.delete(rating_id)
        if result:
            logger.info(f"Deleted rating {rating_id}")

        return result
