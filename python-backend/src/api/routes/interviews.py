"""Interview API routes.

Provides endpoints for interview session management.
All endpoints require authentication.
"""

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from src.api.dependencies import DbSession
from src.api.middleware.auth import CurrentUser
from src.application.dto.interview import (
    InterviewCreateRequest,
    InterviewExportResponse,
    InterviewResponse,
    InterviewUpdateRequest,
    MessageResponse,
)
from src.application.services.interview_service import InterviewService
from src.domain.entities import Interview
from src.infrastructure.repositories.answer_repository import AnswerRepository
from src.infrastructure.repositories.interview_repository import InterviewRepository
from src.infrastructure.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


def get_interview_service(db: DbSession) -> InterviewService:
    """Create interview service with dependencies.

    Args:
        db: Database session from DI

    Returns:
        Configured InterviewService instance
    """
    interview_repo = InterviewRepository(db)
    answer_repo = AnswerRepository(db)
    user_repo = UserRepository(db)
    return InterviewService(interview_repo, answer_repo, user_repo)


InterviewServiceDep = Annotated[InterviewService, Depends(get_interview_service)]


def _interview_to_response(interview: Interview) -> InterviewResponse:
    """Convert Interview entity to InterviewResponse DTO.

    Args:
        interview: Interview domain entity

    Returns:
        InterviewResponse DTO
    """
    return InterviewResponse(
        id=interview.id,
        user_id=interview.user_id,
        session_type=interview.session_type.value,
        competency_focus=interview.competency_focus,
        job_title=interview.job_title,
        job_grade=interview.job_grade.value,
        framework=interview.framework.value,
        total_questions=interview.total_questions,
        current_question_index=interview.current_question_index,
        completed_questions=interview.completed_questions,
        average_score=interview.average_score,
        duration=interview.duration,
        started_at=interview.started_at,
        completed_at=interview.completed_at,
        is_active=interview.is_active,
    )


@router.get(
    "",
    response_model=list[InterviewResponse],
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def get_interviews(
    current_user: CurrentUser,
    interview_service: InterviewServiceDep,
) -> list[InterviewResponse]:
    """Get all interviews for the authenticated user."""
    interviews = await interview_service.get_user_interviews(current_user.id)
    return [_interview_to_response(i) for i in interviews]


@router.get(
    "/{interview_id}",
    response_model=InterviewResponse,
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Access denied"},
        404: {"description": "Interview not found"},
    },
)
async def get_interview(
    interview_id: UUID,
    current_user: CurrentUser,
    interview_service: InterviewServiceDep,
) -> InterviewResponse:
    """Get a specific interview by ID."""
    try:
        interview = await interview_service.get_interview(interview_id, current_user.id)
        return _interview_to_response(interview)

    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Access denied"},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )


@router.post(
    "",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def create_interview(
    request: InterviewCreateRequest,
    current_user: CurrentUser,
    interview_service: InterviewServiceDep,
) -> InterviewResponse:
    """Create a new interview session.

    Automatically deactivates any existing active interview for the user.
    """
    interview = await interview_service.create_interview(
        user_id=current_user.id,
        session_type=request.session_type,
        total_questions=request.total_questions,
        competency_focus=request.competency_focus,
        job_title=request.job_title,
        job_grade=request.job_grade,
        framework=request.framework,
    )
    return _interview_to_response(interview)


@router.patch(
    "/{interview_id}",
    response_model=InterviewResponse,
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Access denied"},
        404: {"description": "Interview not found"},
    },
)
async def update_interview(
    interview_id: UUID,
    request: InterviewUpdateRequest,
    current_user: CurrentUser,
    interview_service: InterviewServiceDep,
) -> InterviewResponse:
    """Update an interview.

    Only provided fields will be updated.
    """
    try:
        # Build updates dict from request, excluding None values
        updates = {}
        if request.current_question_index is not None:
            updates["current_question_index"] = request.current_question_index
        if request.completed_questions is not None:
            updates["completed_questions"] = request.completed_questions
        if request.average_score is not None:
            updates["average_score"] = request.average_score
        if request.duration is not None:
            updates["duration"] = request.duration
        if request.is_active is not None:
            updates["is_active"] = request.is_active
        if request.completed_at is not None:
            updates["completed_at"] = request.completed_at

        interview = await interview_service.update_interview(
            interview_id=interview_id,
            requesting_user_id=current_user.id,
            **updates,
        )
        return _interview_to_response(interview)

    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Access denied"},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )


@router.delete(
    "/{interview_id}",
    response_model=MessageResponse,
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Access denied"},
        404: {"description": "Interview not found"},
        500: {"description": "Failed to delete"},
    },
)
async def delete_interview(
    interview_id: UUID,
    current_user: CurrentUser,
    interview_service: InterviewServiceDep,
) -> MessageResponse:
    """Delete an interview and all associated data."""
    try:
        deleted = await interview_service.delete_interview(interview_id, current_user.id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"message": "Failed to delete interview"},
            )

        return MessageResponse(message="Interview deleted successfully")

    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Access denied"},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )


@router.get(
    "/{interview_id}/answers",
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Access denied"},
        404: {"description": "Interview not found"},
    },
)
async def get_interview_answers(
    interview_id: UUID,
    current_user: CurrentUser,
    interview_service: InterviewServiceDep,
) -> list:
    """Get all answers for an interview."""
    try:
        answers = await interview_service.get_interview_answers(
            interview_id, current_user.id
        )
        # Return answers as dicts for now - will add proper DTO later
        return [
            {
                "id": str(a.id),
                "interviewId": str(a.interview_id) if a.interview_id else None,
                "questionId": str(a.question_id) if a.question_id else None,
                "answerText": a.answer_text,
                "timeSpent": a.time_spent,
                "answeredAt": a.answered_at.isoformat() if a.answered_at else None,
            }
            for a in answers
        ]

    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Access denied"},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )


@router.get(
    "/{interview_id}/export",
    response_model=InterviewExportResponse,
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Access denied"},
        404: {"description": "Interview not found"},
    },
)
async def export_interview(
    interview_id: UUID,
    current_user: CurrentUser,
    interview_service: InterviewServiceDep,
    response: Response,
) -> InterviewExportResponse:
    """Export interview report as JSON.

    Returns a downloadable JSON file with interview data.
    """
    try:
        report = await interview_service.export_interview(interview_id, current_user.id)

        # Set headers for file download
        from datetime import datetime

        filename = f"interview-report-{interview_id}-{datetime.now().strftime('%Y-%m-%d')}.json"
        response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'

        return InterviewExportResponse(
            interview=report["interview"],
            user=report["user"],
            answers=report["answers"],
            exported_at=report["exportedAt"],
        )

    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Access denied"},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )
