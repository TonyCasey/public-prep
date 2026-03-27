"""AI service interface.

Defines the contract for AI-powered interview assistance operations.
"""

from abc import ABC, abstractmethod
from typing import Any, Literal


class IAIService(ABC):
    """Interface for AI-powered interview operations."""

    @abstractmethod
    async def analyze_cv(
        self,
        cv_text: str,
        job_spec_text: str | None = None,
    ) -> dict[str, Any]:
        """Analyze a CV against competency framework.

        Args:
            cv_text: The CV content as text
            job_spec_text: Optional job specification for context

        Returns:
            CVAnalysis dict containing:
            - keyHighlights: List of key strengths
            - competencyStrengths: Dict of competency scores (0-100)
            - improvementAreas: List of areas to improve
            - experienceLevel: 'entry', 'mid', or 'senior'
            - publicSectorExperience: Boolean

        Raises:
            AIServiceError: If analysis fails
        """
        ...

    @abstractmethod
    async def generate_questions(
        self,
        cv_analysis: dict[str, Any],
        job_spec_text: str | None = None,
        focus_competencies: list[str] | None = None,
        total_questions: int = 12,
        framework: Literal["old", "new"] = "old",
        grade: str = "heo",
    ) -> dict[str, Any]:
        """Generate interview questions based on CV analysis.

        Args:
            cv_analysis: Result from analyze_cv
            job_spec_text: Optional job specification
            focus_competencies: Specific competencies to focus on
            total_questions: Number of questions to generate
            framework: Competency framework ('old' or 'new')
            grade: Target grade level

        Returns:
            QuestionSet dict containing:
            - questions: List of question objects
            - totalQuestions: Number of questions
            - competencyDistribution: Questions per competency

        Raises:
            AIServiceError: If generation fails
        """
        ...

    @abstractmethod
    async def evaluate_answer(
        self,
        question_text: str,
        answer_text: str,
        competency: str,
        cv_context: str | None = None,
    ) -> dict[str, Any]:
        """Evaluate an interview answer using STAR method.

        Args:
            question_text: The interview question
            answer_text: The candidate's answer
            competency: Primary competency being assessed
            cv_context: Optional CV text for personalized feedback

        Returns:
            AnswerEvaluation dict containing:
            - overallScore: Score 0-10
            - competencyScores: Dict of all competency scores
            - feedback: Detailed feedback text
            - strengths: List of identified strengths
            - improvementAreas: List of areas to improve
            - improvedAnswer: AI-enhanced version of the answer
            - cvSuggestedAnswer: CV-based alternative (if cv_context provided)
            - starMethodAnalysis: STAR component scores

        Raises:
            AIServiceError: If evaluation fails
        """
        ...

    @abstractmethod
    async def generate_sample_answer(
        self,
        question_text: str,
        competency: str,
        experience_level: Literal["entry", "mid", "senior"] = "mid",
    ) -> dict[str, Any]:
        """Generate a high-scoring sample answer.

        Args:
            question_text: The interview question
            competency: Primary competency being assessed
            experience_level: Target experience level

        Returns:
            Dict containing:
            - sampleAnswer: The generated answer
            - explanation: Why this answer scores highly
            - score: Expected score out of 10

        Raises:
            AIServiceError: If generation fails
        """
        ...


class AIServiceError(Exception):
    """Exception raised when AI service operations fail."""

    def __init__(self, message: str, original_error: Exception | None = None):
        super().__init__(message)
        self.original_error = original_error
