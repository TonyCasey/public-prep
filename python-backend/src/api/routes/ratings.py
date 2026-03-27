"""Rating API routes.

Handles HTTP requests for rating operations.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.dependencies import DbSession
from src.api.middleware.auth import CurrentUser
from src.application.dto.rating import (
    MessageResponse,
    RatingCreateRequest,
    RatingResponse,
    RatingUpdateRequest,
)
from src.application.services.rating_service import RatingService
from src.domain.entities import Rating
from src.infrastructure.repositories.answer_repository import AnswerRepository
from src.infrastructure.repositories.interview_repository import InterviewRepository
from src.infrastructure.repositories.rating_repository import RatingRepository

router = APIRouter(prefix="/api/ratings", tags=["ratings"])


def get_rating_service(db: DbSession) -> RatingService:
    """Create rating service with dependencies.

    Args:
        db: Database session from DI

    Returns:
        Configured RatingService instance
    """
    rating_repo = RatingRepository(db)
    answer_repo = AnswerRepository(db)
    interview_repo = InterviewRepository(db)
    return RatingService(rating_repo, answer_repo, interview_repo)


RatingServiceDep = Annotated[RatingService, Depends(get_rating_service)]


def _to_response(rating: Rating) -> RatingResponse:
    """Convert Rating entity to response DTO."""
    return RatingResponse(
        id=rating.id,
        answerId=rating.answer_id,
        overallScore=rating.overall_score,
        competencyScores=rating.competency_scores,
        starMethodAnalysis=rating.star_method_analysis,
        feedback=rating.feedback,
        strengths=rating.strengths,
        improvementAreas=rating.improvement_areas,
        aiImprovedAnswer=rating.ai_improved_answer,
        evaluation=rating.evaluation,
        ratedAt=rating.rated_at,
    )


@router.get("")
async def get_ratings(
    current_user: CurrentUser,
    rating_service: RatingServiceDep,
    interview_id: UUID | None = Query(None, alias="interviewId"),
    answer_id: UUID | None = Query(None, alias="answerId"),
) -> list[RatingResponse]:
    """Get ratings filtered by interviewId or answerId."""
    try:
        if interview_id:
            ratings = await rating_service.get_ratings_by_interview(
                interview_id, current_user.id
            )
        elif answer_id:
            rating = await rating_service.get_rating_by_answer(
                answer_id, current_user.id
            )
            ratings = [rating]
        else:
            raise HTTPException(
                status_code=400,
                detail="interviewId or answerId parameter required",
            )

        return [_to_response(r) for r in ratings]

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/by-answer/{answer_id}")
async def get_rating_by_answer(
    answer_id: UUID,
    current_user: CurrentUser,
    rating_service: RatingServiceDep,
) -> RatingResponse:
    """Get rating for a specific answer."""
    try:
        rating = await rating_service.get_rating_by_answer(
            answer_id, current_user.id
        )
        return _to_response(rating)

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{rating_id}")
async def get_rating(
    rating_id: UUID,
    current_user: CurrentUser,
    rating_service: RatingServiceDep,
) -> RatingResponse:
    """Get a specific rating by ID."""
    try:
        rating = await rating_service.get_rating(rating_id, current_user.id)
        return _to_response(rating)

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("", status_code=201)
async def create_rating(
    request: RatingCreateRequest,
    current_user: CurrentUser,
    rating_service: RatingServiceDep,
) -> RatingResponse:
    """Create a new rating for an answer."""
    try:
        rating = await rating_service.create_rating(
            answer_id=request.answer_id,
            overall_score=request.overall_score,
            requesting_user_id=current_user.id,
            competency_scores=request.competency_scores,
            star_method_analysis=request.star_method_analysis,
            feedback=request.feedback,
            strengths=request.strengths,
            improvement_areas=request.improvement_areas,
            ai_improved_answer=request.ai_improved_answer,
        )
        return _to_response(rating)

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(status_code=409, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{rating_id}")
async def update_rating(
    rating_id: UUID,
    request: RatingUpdateRequest,
    current_user: CurrentUser,
    rating_service: RatingServiceDep,
) -> RatingResponse:
    """Update an existing rating."""
    try:
        rating = await rating_service.update_rating(
            rating_id=rating_id,
            requesting_user_id=current_user.id,
            overall_score=request.overall_score,
            competency_scores=request.competency_scores,
            star_method_analysis=request.star_method_analysis,
            feedback=request.feedback,
            strengths=request.strengths,
            improvement_areas=request.improvement_areas,
            ai_improved_answer=request.ai_improved_answer,
        )
        return _to_response(rating)

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{rating_id}")
async def delete_rating(
    rating_id: UUID,
    current_user: CurrentUser,
    rating_service: RatingServiceDep,
) -> MessageResponse:
    """Delete a rating."""
    try:
        deleted = await rating_service.delete_rating(rating_id, current_user.id)
        if deleted:
            return MessageResponse(message="Rating deleted successfully")
        raise HTTPException(status_code=500, detail="Failed to delete rating")

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
