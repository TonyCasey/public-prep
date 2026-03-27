"""Question API routes.

Handles HTTP requests for question operations.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.dependencies import DbSession
from src.api.middleware.auth import CurrentUser
from src.application.dto.question import (
    MessageResponse,
    QuestionCreateRequest,
    QuestionResponse,
)
from src.application.services.question_service import QuestionService
from src.domain.entities import Question
from src.infrastructure.repositories.interview_repository import InterviewRepository
from src.infrastructure.repositories.question_repository import QuestionRepository

router = APIRouter(prefix="/api/questions", tags=["questions"])


def get_question_service(db: DbSession) -> QuestionService:
    """Create question service with dependencies.

    Args:
        db: Database session from DI

    Returns:
        Configured QuestionService instance
    """
    question_repo = QuestionRepository(db)
    interview_repo = InterviewRepository(db)
    return QuestionService(question_repo, interview_repo)


QuestionServiceDep = Annotated[QuestionService, Depends(get_question_service)]


def _to_response(question: Question) -> QuestionResponse:
    """Convert Question entity to response DTO."""
    return QuestionResponse(
        id=question.id,
        userId=question.user_id,
        interviewId=question.interview_id,
        competency=question.competency,
        questionText=question.question_text,
        difficulty=question.difficulty.value,
        generatedAt=question.generated_at,
    )


@router.get("")
async def get_questions(
    current_user: CurrentUser,
    question_service: QuestionServiceDep,
    interview_id: UUID | None = Query(None, alias="interviewId"),
    competency: str | None = Query(None),
) -> list[QuestionResponse]:
    """Get questions filtered by interviewId or competency.

    Requires at least one filter parameter.
    """
    if interview_id is None and competency is None:
        raise HTTPException(
            status_code=400,
            detail="interviewId or competency parameter required",
        )

    try:
        if interview_id:
            questions = await question_service.get_questions_by_interview(
                interview_id, current_user.id
            )
        else:
            questions = await question_service.get_questions_by_competency(
                competency, current_user.id
            )

        return [_to_response(q) for q in questions]

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/interview/{interview_id}/current")
async def get_current_question(
    interview_id: UUID,
    current_user: CurrentUser,
    question_service: QuestionServiceDep,
) -> QuestionResponse:
    """Get current question for an interview session."""
    try:
        question = await question_service.get_current_question(
            interview_id, current_user.id
        )
        return _to_response(question)

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/single/{question_id}")
async def get_question_by_id(
    question_id: UUID,
    current_user: CurrentUser,
    question_service: QuestionServiceDep,
) -> QuestionResponse:
    """Get a specific question by ID."""
    try:
        question = await question_service.get_question(question_id, current_user.id)
        return _to_response(question)

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{interview_id}")
async def get_questions_for_interview(
    interview_id: UUID,
    current_user: CurrentUser,
    question_service: QuestionServiceDep,
) -> list[QuestionResponse]:
    """Get all questions for a specific interview."""
    try:
        questions = await question_service.get_questions_by_interview(
            interview_id, current_user.id
        )
        return [_to_response(q) for q in questions]

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("", status_code=201)
async def create_question(
    request: QuestionCreateRequest,
    current_user: CurrentUser,
    question_service: QuestionServiceDep,
) -> QuestionResponse:
    """Create a new question."""
    try:
        question = await question_service.create_question(
            user_id=current_user.id,
            interview_id=request.interview_id,
            competency=request.competency,
            question_text=request.question_text,
            difficulty=request.difficulty,
        )
        return _to_response(question)

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{question_id}")
async def delete_question(
    question_id: UUID,
    current_user: CurrentUser,
    question_service: QuestionServiceDep,
) -> MessageResponse:
    """Delete a question."""
    try:
        deleted = await question_service.delete_question(question_id, current_user.id)
        if deleted:
            return MessageResponse(message="Question deleted successfully")
        raise HTTPException(status_code=500, detail="Failed to delete question")

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
