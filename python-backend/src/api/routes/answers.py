"""Answer API routes.

Handles HTTP requests for answer operations.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.dependencies import DbSession
from src.api.middleware.auth import CurrentUser
from src.application.dto.answer import (
    AnswerCreateRequest,
    AnswerResponse,
    AnswerUpdateRequest,
    AnswerWithEvaluationResponse,
    MessageResponse,
)
from src.application.services.answer_service import AnswerService
from src.domain.entities import Answer
from src.infrastructure.repositories.answer_repository import AnswerRepository
from src.infrastructure.repositories.interview_repository import InterviewRepository
from src.infrastructure.repositories.question_repository import QuestionRepository

router = APIRouter(prefix="/api/answers", tags=["answers"])


def get_answer_service(db: DbSession) -> AnswerService:
    """Create answer service with dependencies.

    Args:
        db: Database session from DI

    Returns:
        Configured AnswerService instance
    """
    answer_repo = AnswerRepository(db)
    interview_repo = InterviewRepository(db)
    question_repo = QuestionRepository(db)
    return AnswerService(answer_repo, interview_repo, question_repo)


AnswerServiceDep = Annotated[AnswerService, Depends(get_answer_service)]


def _to_response(answer: Answer) -> AnswerResponse:
    """Convert Answer entity to response DTO."""
    return AnswerResponse(
        id=answer.id,
        interviewId=answer.interview_id,
        questionId=answer.question_id,
        answerText=answer.answer_text,
        timeSpent=answer.time_spent,
        answeredAt=answer.answered_at,
    )


@router.get("")
async def get_answers(
    current_user: CurrentUser,
    answer_service: AnswerServiceDep,
    interview_id: UUID | None = Query(None, alias="interviewId"),
    question_id: UUID | None = Query(None, alias="questionId"),
    competency: str | None = Query(None),
) -> list[AnswerResponse]:
    """Get answers filtered by interviewId, questionId, or competency."""
    try:
        if interview_id:
            answers = await answer_service.get_answers_by_interview(
                interview_id, current_user.id
            )
        elif question_id:
            answers = await answer_service.get_answers_by_question(
                question_id, current_user.id
            )
        elif competency:
            answers = await answer_service.get_answers_by_competency(
                competency, current_user.id
            )
        else:
            # Get all answers across all interviews
            # This is handled by getting by competency with no filter
            # but that requires iterating all interviews
            raise HTTPException(
                status_code=400,
                detail="interviewId, questionId, or competency parameter required",
            )

        return [_to_response(a) for a in answers]

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/by-interview/{interview_id}")
async def get_answers_by_interview(
    interview_id: UUID,
    current_user: CurrentUser,
    answer_service: AnswerServiceDep,
) -> list[AnswerResponse]:
    """Get all answers for a specific interview."""
    try:
        answers = await answer_service.get_answers_by_interview(
            interview_id, current_user.id
        )
        return [_to_response(a) for a in answers]

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/by-question/{question_id}")
async def get_answers_by_question(
    question_id: UUID,
    current_user: CurrentUser,
    answer_service: AnswerServiceDep,
) -> list[AnswerResponse]:
    """Get answers for a specific question."""
    try:
        answers = await answer_service.get_answers_by_question(
            question_id, current_user.id
        )
        return [_to_response(a) for a in answers]

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{answer_id}")
async def get_answer(
    answer_id: UUID,
    current_user: CurrentUser,
    answer_service: AnswerServiceDep,
) -> AnswerResponse:
    """Get a specific answer by ID."""
    try:
        answer = await answer_service.get_answer(answer_id, current_user.id)
        return _to_response(answer)

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("", status_code=201)
async def create_answer(
    request: AnswerCreateRequest,
    current_user: CurrentUser,
    answer_service: AnswerServiceDep,
) -> AnswerWithEvaluationResponse:
    """Create a new answer.

    If an answer already exists for the question, it will be updated.
    AI evaluation will be added in a future update.
    """
    try:
        answer = await answer_service.create_answer(
            interview_id=request.interview_id,
            question_id=request.question_id,
            answer_text=request.answer_text,
            requesting_user_id=current_user.id,
            time_spent=request.time_spent,
        )

        # TODO: Trigger AI evaluation (Task 15-16)
        # For now, return without evaluation
        response = AnswerWithEvaluationResponse(
            id=answer.id,
            interviewId=answer.interview_id,
            questionId=answer.question_id,
            answerText=answer.answer_text,
            timeSpent=answer.time_spent,
            answeredAt=answer.answered_at,
            evaluation=None,
        )

        return response

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{answer_id}")
async def update_answer(
    answer_id: UUID,
    request: AnswerUpdateRequest,
    current_user: CurrentUser,
    answer_service: AnswerServiceDep,
) -> AnswerResponse:
    """Update an existing answer."""
    try:
        answer = await answer_service.update_answer(
            answer_id=answer_id,
            requesting_user_id=current_user.id,
            answer_text=request.answer_text,
            time_spent=request.time_spent,
        )
        return _to_response(answer)

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{answer_id}")
async def delete_answer(
    answer_id: UUID,
    current_user: CurrentUser,
    answer_service: AnswerServiceDep,
) -> MessageResponse:
    """Delete an answer."""
    try:
        deleted = await answer_service.delete_answer(answer_id, current_user.id)
        if deleted:
            return MessageResponse(message="Answer deleted successfully")
        raise HTTPException(status_code=500, detail="Failed to delete answer")

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
