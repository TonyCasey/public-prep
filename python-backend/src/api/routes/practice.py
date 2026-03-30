"""Practice session API routes.

Handles HTTP requests for starting and managing practice interview sessions.
"""

import logging
import re
from datetime import UTC, datetime
from typing import Any, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from src.api.dependencies import DbSession
from src.api.middleware.auth import CurrentUser
from src.application.interfaces.ai_service import AIServiceError, IAIService
from src.domain.entities import Interview, Question
from src.domain.value_objects import Difficulty, Framework, Grade, SessionType
from src.infrastructure.config import get_settings
from src.infrastructure.repositories.document_repository import DocumentRepository
from src.infrastructure.repositories.interview_repository import InterviewRepository
from src.infrastructure.repositories.question_repository import QuestionRepository
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.services.ai_service import AnthropicAIService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/practice", tags=["practice"])


# Request/Response Models


class StartPracticeRequest(BaseModel):
    """Start practice session request."""

    session_type: Literal["full", "quick", "competency"] = Field(
        "full", alias="sessionType"
    )
    competencies: list[str] = Field(default_factory=list)
    question_count: int = Field(12, alias="questionCount", ge=1, le=20)
    framework: Literal["old", "new"] = "old"
    grade: str = "heo"

    model_config = {"populate_by_name": True}


class QuestionResponse(BaseModel):
    """Question response model."""

    id: UUID
    user_id: str = Field(alias="userId")
    interview_id: UUID | None = Field(alias="interviewId")
    competency: str
    question_text: str = Field(alias="questionText")
    difficulty: str
    generated_at: datetime | None = Field(alias="generatedAt")

    model_config = {"populate_by_name": True, "from_attributes": True}


class InterviewResponse(BaseModel):
    """Interview response model."""

    id: UUID
    user_id: str = Field(alias="userId")
    session_type: str = Field(alias="sessionType")
    competency_focus: list[str] | None = Field(alias="competencyFocus")
    job_title: str | None = Field(alias="jobTitle")
    job_grade: str = Field(alias="jobGrade")
    framework: str
    total_questions: int = Field(alias="totalQuestions")
    current_question_index: int = Field(alias="currentQuestionIndex")
    is_active: bool = Field(alias="isActive")

    model_config = {"populate_by_name": True, "from_attributes": True}


class StartPracticeResponse(BaseModel):
    """Start practice session response."""

    interview: InterviewResponse
    questions: list[QuestionResponse]
    current_question: QuestionResponse = Field(alias="currentQuestion")
    total_questions: int = Field(alias="totalQuestions")
    competency_distribution: dict[str, int] = Field(alias="competencyDistribution")

    model_config = {"populate_by_name": True}


# Helper functions


def get_ai_service() -> IAIService:
    """Get AI service instance."""
    settings = get_settings()

    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="AI service not configured. Please set ANTHROPIC_API_KEY.",
        )

    return AnthropicAIService(settings.anthropic_api_key)


def extract_job_title_from_text(text: str) -> str | None:
    """Extract job title from job specification text.

    Args:
        text: Job specification content

    Returns:
        Extracted job title or None
    """
    # Common patterns for job titles in Irish Civil Service
    patterns = [
        r"(?:Job Title|Position|Role)[:\s]+([^\n]+)",
        r"(?:Grade|Level)[:\s]+((?:HEO|EO|AO|CO|AP|PO)[^\n]*)",
        r"^((?:Higher |)Executive Officer[^\n]*)",
        r"^((?:Administrative |)Officer[^\n]*)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            title = match.group(1).strip()
            # Clean up the title
            title = re.sub(r"\s+", " ", title)
            if len(title) > 5 and len(title) < 100:
                return title

    return None


def get_effective_subscription_status(user: Any) -> dict[str, Any]:
    """Get effective subscription status considering expiry.

    Args:
        user: User entity

    Returns:
        Dict with status and optional expiry message
    """
    if not user.subscription_status or user.subscription_status == "free":
        return {"status": "free"}

    if user.subscription_status == "starter":
        # Check if starter plan has expired
        if user.starter_expires_at and datetime.now(UTC) > user.starter_expires_at:
            return {"status": "free", "expiryMessage": "Your starter plan has expired"}
        return {"status": "starter"}

    return {"status": user.subscription_status}


# Routes


@router.post(
    "/start",
    response_model=StartPracticeResponse,
    responses={
        400: {"description": "CV not uploaded or analyzed"},
        403: {"description": "Subscription limit reached"},
        404: {"description": "User not found"},
    },
)
async def start_practice(
    request: StartPracticeRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> StartPracticeResponse:
    """Start a new practice interview session.

    This endpoint:
    1. Checks subscription status and usage limits
    2. Retrieves CV analysis and job spec
    3. Generates AI-powered interview questions
    4. Creates the interview session
    5. Saves questions to database
    """
    user_id = current_user.id

    # Initialize repositories
    user_repo = UserRepository(db)
    doc_repo = DocumentRepository(db)
    interview_repo = InterviewRepository(db)
    question_repo = QuestionRepository(db)

    # Get user for subscription check
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "User not found"},
        )

    # Check subscription status
    subscription_info = get_effective_subscription_status(user)

    # Check usage limits for starter plan
    if subscription_info["status"] == "starter":
        starter_interviews_used = user.starter_interviews_used or 0
        if starter_interviews_used >= 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": "You've used your 1 interview in the starter package. Upgrade to premium for unlimited access.",
                    "code": "STARTER_LIMIT_REACHED",
                },
            )

    # Get CV document with analysis
    cv_doc = await doc_repo.get_cv(user_id)
    if not cv_doc or not cv_doc.analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Please upload and analyze your CV first"},
        )

    # Get job spec if available
    job_spec_doc = await doc_repo.get_job_spec(user_id)

    # Extract job title
    job_title = "HEO Interview"
    if job_spec_doc:
        extracted_title = extract_job_title_from_text(job_spec_doc.content)
        if extracted_title:
            job_title = extracted_title
        elif job_spec_doc.filename:
            # Use filename without extension
            job_title = re.sub(r"\.(pdf|docx?|txt)$", "", job_spec_doc.filename, flags=re.IGNORECASE)

    # Get AI service and generate questions
    try:
        ai_service = get_ai_service()
        question_set = await ai_service.generate_questions(
            cv_analysis=cv_doc.analysis,
            job_spec_text=job_spec_doc.content if job_spec_doc else None,
            focus_competencies=request.competencies if request.competencies else None,
            total_questions=request.question_count,
            framework=request.framework,
            grade=request.grade,
        )
    except AIServiceError as e:
        logger.error(f"AI question generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": str(e)},
        )

    # Deactivate any existing active interviews
    existing_interview = await interview_repo.get_active_interview(user_id)
    if existing_interview:
        existing_interview.is_active = False
        await interview_repo.update(existing_interview)

    # Create new interview session
    interview = Interview(
        id=uuid4(),
        user_id=user_id,
        session_type=SessionType(request.session_type),
        competency_focus=request.competencies if request.competencies else None,
        job_title=job_title,
        job_grade=Grade(request.grade.lower()),
        framework=Framework(request.framework),
        total_questions=question_set.get("totalQuestions", request.question_count),
        current_question_index=0,
        is_active=True,
        started_at=datetime.now(UTC),
    )

    created_interview = await interview_repo.create(interview)

    # Save generated questions to database
    saved_questions = []
    for q in question_set.get("questions", []):
        # Map difficulty string to enum
        difficulty_str = q.get("difficulty", "intermediate").lower()
        try:
            difficulty = Difficulty(difficulty_str)
        except ValueError:
            difficulty = Difficulty.INTERMEDIATE

        question = Question(
            id=uuid4(),
            user_id=user_id,
            interview_id=created_interview.id,
            competency=q.get("competency", ""),
            question_text=q.get("questionText", ""),
            difficulty=difficulty,
            generated_at=datetime.now(UTC),
        )
        saved = await question_repo.create(question)
        saved_questions.append(saved)

    # Increment starter interview counter if on starter plan
    if subscription_info["status"] == "starter":
        current_count = user.starter_interviews_used or 0
        user.starter_interviews_used = current_count + 1
        await user_repo.update(user)

    logger.info(
        f"Started practice session for user {user_id}: "
        f"interview={created_interview.id}, questions={len(saved_questions)}"
    )

    # Build response
    interview_response = InterviewResponse(
        id=created_interview.id,
        userId=created_interview.user_id,
        sessionType=created_interview.session_type.value,
        competencyFocus=created_interview.competency_focus,
        jobTitle=created_interview.job_title,
        jobGrade=created_interview.job_grade.value,
        framework=created_interview.framework.value,
        totalQuestions=created_interview.total_questions,
        currentQuestionIndex=created_interview.current_question_index,
        isActive=created_interview.is_active,
    )

    question_responses = [
        QuestionResponse(
            id=q.id,
            userId=q.user_id,
            interviewId=q.interview_id,
            competency=q.competency,
            questionText=q.question_text,
            difficulty=q.difficulty.value,
            generatedAt=q.generated_at,
        )
        for q in saved_questions
    ]

    return StartPracticeResponse(
        interview=interview_response,
        questions=question_responses,
        currentQuestion=question_responses[0] if question_responses else None,
        totalQuestions=len(saved_questions),
        competencyDistribution=question_set.get("competencyDistribution", {}),
    )
