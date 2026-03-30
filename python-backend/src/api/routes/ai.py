"""AI API routes.

Handles HTTP requests for AI-powered interview assistance.
"""

import logging
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from src.api.dependencies import DbSession
from src.api.middleware.auth import CurrentUser
from src.application.interfaces.ai_service import AIServiceError, IAIService
from src.infrastructure.config import get_settings
from src.infrastructure.repositories.document_repository import DocumentRepository
from src.infrastructure.services.ai_service import AnthropicAIService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ai"])


def get_ai_service(request: Request) -> IAIService:
    """Get AI service instance.

    Args:
        request: FastAPI request (for accessing app state)

    Returns:
        Configured AI service

    Raises:
        HTTPException: If API key not configured
    """
    settings = get_settings()

    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="AI service not configured. Please set ANTHROPIC_API_KEY.",
        )

    return AnthropicAIService(settings.anthropic_api_key)


# Request/Response Models


class AnalyzeCVRequest(BaseModel):
    """CV analysis request (for direct text input)."""

    cv_text: str = Field(..., alias="cvText", min_length=100)
    job_spec_text: str | None = Field(None, alias="jobSpecText")

    model_config = {"populate_by_name": True}


class GenerateQuestionsRequest(BaseModel):
    """Question generation request."""

    cv_analysis: dict[str, Any] = Field(..., alias="cvAnalysis")
    job_spec_text: str | None = Field(None, alias="jobSpecText")
    focus_competencies: list[str] | None = Field(None, alias="focusCompetencies")
    total_questions: int = Field(12, alias="totalQuestions", ge=1, le=20)
    framework: Literal["old", "new"] = "old"
    grade: str = "heo"

    model_config = {"populate_by_name": True}


class EvaluateAnswerRequest(BaseModel):
    """Answer evaluation request."""

    question_text: str = Field(..., alias="questionText", min_length=10)
    answer_text: str = Field(..., alias="answerText", min_length=20)
    competency: str
    cv_context: str | None = Field(None, alias="cvContext")

    model_config = {"populate_by_name": True}


class SampleEvaluateRequest(BaseModel):
    """Sample evaluation request (public endpoint)."""

    question_text: str = Field(..., alias="questionText", min_length=10)
    answer_text: str = Field(..., alias="answerText", min_length=20)

    model_config = {"populate_by_name": True}


class GenerateSampleAnswerRequest(BaseModel):
    """Sample answer generation request."""

    question_text: str = Field(..., alias="questionText", min_length=10)
    competency: str
    experience_level: Literal["entry", "mid", "senior"] = Field(
        "mid", alias="experienceLevel"
    )

    model_config = {"populate_by_name": True}


# Routes - AI namespace (/api/ai/*)


@router.post("/ai/analyze-cv")
async def analyze_cv_direct(
    request: AnalyzeCVRequest,
    current_user: CurrentUser,
    ai_service: IAIService = Depends(get_ai_service),
) -> dict[str, Any]:
    """Analyze a CV against competency framework (direct text input).

    Returns key highlights, competency strengths, improvement areas,
    experience level, and public sector experience indicator.
    """
    try:
        result = await ai_service.analyze_cv(
            cv_text=request.cv_text,
            job_spec_text=request.job_spec_text,
        )
        return result

    except AIServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/generate-questions")
async def generate_questions(
    request: GenerateQuestionsRequest,
    current_user: CurrentUser,
    ai_service: IAIService = Depends(get_ai_service),
) -> dict[str, Any]:
    """Generate interview questions based on CV analysis.

    Returns a set of competency-based questions tailored to the
    candidate's experience and the target grade level.
    """
    try:
        result = await ai_service.generate_questions(
            cv_analysis=request.cv_analysis,
            job_spec_text=request.job_spec_text,
            focus_competencies=request.focus_competencies,
            total_questions=request.total_questions,
            framework=request.framework,
            grade=request.grade,
        )
        return result

    except AIServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/evaluate-answer")
async def evaluate_answer(
    request: EvaluateAnswerRequest,
    current_user: CurrentUser,
    ai_service: IAIService = Depends(get_ai_service),
) -> dict[str, Any]:
    """Evaluate an interview answer using STAR method.

    Returns scores, feedback, strengths, improvement areas,
    and an AI-improved version of the answer.
    """
    try:
        result = await ai_service.evaluate_answer(
            question_text=request.question_text,
            answer_text=request.answer_text,
            competency=request.competency,
            cv_context=request.cv_context,
        )
        return result

    except AIServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/generate-sample-answer")
async def generate_sample_answer(
    request: GenerateSampleAnswerRequest,
    current_user: CurrentUser,
    ai_service: IAIService = Depends(get_ai_service),
) -> dict[str, Any]:
    """Generate a high-scoring sample answer.

    Returns a sample answer using STAR method with explanation
    of why it scores highly.
    """
    try:
        result = await ai_service.generate_sample_answer(
            question_text=request.question_text,
            competency=request.competency,
            experience_level=request.experience_level,
        )
        return result

    except AIServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))


# Routes - CV namespace (/api/cv/*) - TypeScript backend compatible


@router.post("/cv/analyze")
async def analyze_cv(
    current_user: CurrentUser,
    db: DbSession,
    ai_service: IAIService = Depends(get_ai_service),
) -> dict[str, Any]:
    """Analyze user's uploaded CV document.

    Retrieves the user's CV and job spec from the database,
    performs AI analysis, and updates the document with results.

    This endpoint matches the TypeScript backend's /api/cv/analyze.
    """
    user_id = current_user.id

    # Initialize repository
    doc_repo = DocumentRepository(db)

    # Get CV document
    cv_doc = await doc_repo.get_cv(user_id)
    if not cv_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "No CV uploaded"},
        )

    # Get job spec if available
    job_spec_doc = await doc_repo.get_job_spec(user_id)

    # Perform AI analysis
    try:
        analysis = await ai_service.analyze_cv(
            cv_text=cv_doc.content,
            job_spec_text=job_spec_doc.content if job_spec_doc else None,
        )
    except AIServiceError as e:
        logger.error(f"CV analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Analysis failed. Please try again."},
        )

    # Update document with analysis
    await doc_repo.update_analysis(cv_doc.id, analysis)

    logger.info(f"CV analyzed for user {user_id}")

    return analysis


# Routes - Sample namespace (/api/sample/*) - Public endpoints


@router.post("/sample/evaluate")
async def sample_evaluate(
    request: SampleEvaluateRequest,
    ai_service: IAIService = Depends(get_ai_service),
) -> dict[str, Any]:
    """Evaluate a sample answer (public endpoint, no auth required).

    This endpoint allows unauthenticated users to try the evaluation
    feature with a sample question and answer.
    """
    try:
        result = await ai_service.evaluate_answer(
            question_text=request.question_text,
            answer_text=request.answer_text,
            competency="Team Leadership",  # Default competency for sample
            cv_context=None,
        )
        return result

    except AIServiceError as e:
        error_message = str(e)
        # Check if it's an OpenAI overloaded error
        if "Overloaded" in error_message or "529" in error_message:
            raise HTTPException(
                status_code=503,
                detail={
                    "message": "OpenAI seems to be busy at the moment. Please try again in a few minutes.",
                    "userFriendly": True,
                },
            )

        raise HTTPException(
            status_code=500,
            detail={"message": error_message},
        )
