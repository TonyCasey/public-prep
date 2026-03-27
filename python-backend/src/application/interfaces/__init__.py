"""Application interfaces package.

Exports service interfaces for dependency injection.
"""

from src.application.interfaces.ai_service import AIServiceError, IAIService
from src.application.interfaces.answer_service import IAnswerService
from src.application.interfaces.auth_service import IAuthService
from src.application.interfaces.document_service import IDocumentService
from src.application.interfaces.interview_service import IInterviewService
from src.application.interfaces.question_service import IQuestionService
from src.application.interfaces.rating_service import IRatingService
from src.application.interfaces.email_service import (
    ContactFormData,
    EmailServiceError,
    IEmailService,
    InterviewSessionDetails,
    MilestoneDetails,
)
from src.application.interfaces.speech_service import (
    ISpeechService,
    SpeechServiceError,
    TranscriptionResult,
)
from src.application.interfaces.stripe_service import (
    CheckoutSession,
    Customer,
    IStripeService,
    StripeServiceError,
    Subscription,
)
from src.application.interfaces.user_service import IUserService

__all__ = [
    "AIServiceError",
    "IAIService",
    "IAnswerService",
    "IAuthService",
    "IDocumentService",
    "IEmailService",
    "IInterviewService",
    "IQuestionService",
    "IRatingService",
    "ISpeechService",
    "IStripeService",
    "IUserService",
    # Stripe types
    "CheckoutSession",
    "Customer",
    "StripeServiceError",
    "Subscription",
    # Email types
    "ContactFormData",
    "EmailServiceError",
    "InterviewSessionDetails",
    "MilestoneDetails",
    # Speech types
    "SpeechServiceError",
    "TranscriptionResult",
]
