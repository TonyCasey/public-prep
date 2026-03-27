"""Pytest configuration and shared fixtures.

Provides common test utilities, fixtures, and configuration
for the Python backend test suite.
"""

import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession


# ============================================================================
# Pytest Configuration
# ============================================================================


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# Database Fixtures
# ============================================================================


@pytest.fixture
def mock_db_session() -> MagicMock:
    """Create a mock database session.

    Returns:
        MagicMock configured as an AsyncSession
    """
    session = MagicMock(spec=AsyncSession)
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    session.refresh = AsyncMock()
    session.add = MagicMock()
    return session


# ============================================================================
# User Fixtures
# ============================================================================


@pytest.fixture
def sample_user_id() -> str:
    """Generate a sample user UUID."""
    return str(uuid4())


@pytest.fixture
def sample_user_data() -> dict:
    """Create sample user data for tests.

    Returns:
        Dict with common user fields
    """
    return {
        "id": str(uuid4()),
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "subscription_status": "free",
        "is_admin": False,
    }


@pytest.fixture
def mock_current_user(sample_user_data: dict) -> MagicMock:
    """Create a mock authenticated user.

    Args:
        sample_user_data: User data fixture

    Returns:
        MagicMock configured as a User entity
    """
    user = MagicMock()
    user.id = sample_user_data["id"]
    user.email = sample_user_data["email"]
    user.first_name = sample_user_data["first_name"]
    user.last_name = sample_user_data["last_name"]
    user.subscription_status = sample_user_data["subscription_status"]
    user.is_admin = sample_user_data["is_admin"]
    return user


# ============================================================================
# Interview Fixtures
# ============================================================================


@pytest.fixture
def sample_interview_id() -> str:
    """Generate a sample interview UUID."""
    return str(uuid4())


@pytest.fixture
def sample_interview_data(sample_user_id: str) -> dict:
    """Create sample interview data.

    Args:
        sample_user_id: User ID fixture

    Returns:
        Dict with interview fields
    """
    return {
        "id": str(uuid4()),
        "user_id": sample_user_id,
        "job_title": "Higher Executive Officer",
        "grade": "heo",
        "framework": "old",
        "status": "active",
        "overall_score": 0.0,
    }


# ============================================================================
# Question Fixtures
# ============================================================================


@pytest.fixture
def sample_question_id() -> str:
    """Generate a sample question UUID."""
    return str(uuid4())


@pytest.fixture
def sample_question_data(sample_interview_id: str) -> dict:
    """Create sample question data.

    Args:
        sample_interview_id: Interview ID fixture

    Returns:
        Dict with question fields
    """
    return {
        "id": str(uuid4()),
        "interview_id": sample_interview_id,
        "competency": "Team Leadership",
        "question_text": "Tell me about a time you led a team.",
        "difficulty": "intermediate",
        "order": 1,
    }


# ============================================================================
# Answer Fixtures
# ============================================================================


@pytest.fixture
def sample_answer_id() -> str:
    """Generate a sample answer UUID."""
    return str(uuid4())


@pytest.fixture
def sample_answer_data(sample_question_id: str) -> dict:
    """Create sample answer data.

    Args:
        sample_question_id: Question ID fixture

    Returns:
        Dict with answer fields
    """
    return {
        "id": str(uuid4()),
        "question_id": sample_question_id,
        "answer_text": "In my previous role, I led a team of 5 developers...",
        "recording_url": None,
        "score": 7.5,
    }


# ============================================================================
# AI Service Fixtures
# ============================================================================


@pytest.fixture
def sample_cv_analysis() -> dict:
    """Create sample CV analysis result.

    Returns:
        Dict matching CV analysis response format
    """
    return {
        "keyHighlights": [
            "10 years software development experience",
            "Team leadership experience",
            "Public sector background",
        ],
        "competencyStrengths": {
            "Team Leadership": 75,
            "Drive & Commitment": 80,
            "Analysis & Decision Making": 70,
        },
        "improvementAreas": [
            "Could emphasize stakeholder management more",
            "Limited evidence of policy development",
        ],
        "experienceLevel": "senior",
        "publicSectorExperience": True,
    }


@pytest.fixture
def sample_answer_evaluation() -> dict:
    """Create sample answer evaluation result.

    Returns:
        Dict matching answer evaluation response format
    """
    return {
        "overallScore": 7.5,
        "competencyScores": {
            "Team Leadership": 8,
        },
        "feedback": "Good answer with clear STAR structure.",
        "strengths": [
            "Clear situation description",
            "Specific actions taken",
        ],
        "improvementAreas": [
            "Could quantify results more",
        ],
        "improvedAnswer": "An improved version...",
        "starMethodAnalysis": {
            "situation": 8,
            "task": 7,
            "action": 8,
            "result": 7,
        },
    }


# ============================================================================
# Mock Service Fixtures
# ============================================================================


@pytest.fixture
def mock_ai_service() -> MagicMock:
    """Create a mock AI service.

    Returns:
        MagicMock configured as IAIService
    """
    service = MagicMock()
    service.analyze_cv = AsyncMock()
    service.generate_questions = AsyncMock()
    service.evaluate_answer = AsyncMock()
    service.generate_sample_answer = AsyncMock()
    return service


@pytest.fixture
def mock_email_service() -> MagicMock:
    """Create a mock email service.

    Returns:
        MagicMock configured as IEmailService
    """
    service = MagicMock()
    service.is_configured = True
    service.send_welcome_email = AsyncMock(return_value=True)
    service.send_password_reset_email = AsyncMock(return_value=True)
    service.send_payment_confirmation_email = AsyncMock(return_value=True)
    return service


@pytest.fixture
def mock_stripe_service() -> MagicMock:
    """Create a mock Stripe service.

    Returns:
        MagicMock configured as IStripeService
    """
    service = MagicMock()
    service.is_configured = True
    service.create_customer = AsyncMock()
    service.create_checkout_session = AsyncMock()
    service.get_subscription = AsyncMock()
    service.cancel_subscription = AsyncMock()
    service.construct_webhook_event = MagicMock()
    return service


@pytest.fixture
def mock_speech_service() -> MagicMock:
    """Create a mock speech service.

    Returns:
        MagicMock configured as ISpeechService
    """
    service = MagicMock()
    service.is_configured = True
    service.provider_name = "mock"
    service.transcribe = AsyncMock()
    return service


# ============================================================================
# Repository Mock Fixtures
# ============================================================================


@pytest.fixture
def mock_user_repository() -> MagicMock:
    """Create a mock user repository.

    Returns:
        MagicMock configured as IUserRepository
    """
    repo = MagicMock()
    repo.get_by_id = AsyncMock()
    repo.get_by_email = AsyncMock()
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    repo.delete = AsyncMock()
    return repo


@pytest.fixture
def mock_interview_repository() -> MagicMock:
    """Create a mock interview repository.

    Returns:
        MagicMock configured as IInterviewRepository
    """
    repo = MagicMock()
    repo.get_by_id = AsyncMock()
    repo.get_by_user = AsyncMock()
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    repo.delete = AsyncMock()
    return repo


@pytest.fixture
def mock_question_repository() -> MagicMock:
    """Create a mock question repository.

    Returns:
        MagicMock configured as IQuestionRepository
    """
    repo = MagicMock()
    repo.get_by_id = AsyncMock()
    repo.get_by_interview = AsyncMock()
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    repo.delete = AsyncMock()
    return repo
