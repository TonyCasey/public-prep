"""Domain layer module.

Contains the core business logic of the application:
- Entities: Core business objects (User, Interview, Question, etc.)
- Value Objects: Immutable types (enums, constants)
- Errors: Domain-specific exceptions
- Interfaces: Repository contracts for data access

The domain layer has ZERO external dependencies and represents
the heart of the application's business logic.
"""

from .entities import (
    Answer,
    Document,
    Interview,
    Question,
    Rating,
    User,
    UserProgress,
)
from .errors import (
    AnswerNotFoundError,
    AuthenticationError,
    AuthorizationError,
    BusinessRuleError,
    ConflictError,
    DocumentNotFoundError,
    DomainError,
    InterviewNotFoundError,
    NotFoundError,
    QuestionNotFoundError,
    RatingNotFoundError,
    UserNotFoundError,
    ValidationError,
)
from .interfaces import (
    IAnswerRepository,
    IDocumentRepository,
    IInterviewRepository,
    IQuestionRepository,
    IRatingRepository,
    IRepository,
    IUserRepository,
)
from .value_objects import (
    BackupType,
    Competency,
    Difficulty,
    DocumentType,
    Framework,
    Grade,
    SessionType,
    SubscriptionStatus,
)

__all__ = [
    # Entities
    "Answer",
    "Document",
    "Interview",
    "Question",
    "Rating",
    "User",
    "UserProgress",
    # Value Objects
    "BackupType",
    "Competency",
    "Difficulty",
    "DocumentType",
    "Framework",
    "Grade",
    "SessionType",
    "SubscriptionStatus",
    # Errors
    "AnswerNotFoundError",
    "AuthenticationError",
    "AuthorizationError",
    "BusinessRuleError",
    "ConflictError",
    "DocumentNotFoundError",
    "DomainError",
    "InterviewNotFoundError",
    "NotFoundError",
    "QuestionNotFoundError",
    "RatingNotFoundError",
    "UserNotFoundError",
    "ValidationError",
    # Interfaces
    "IAnswerRepository",
    "IDocumentRepository",
    "IInterviewRepository",
    "IQuestionRepository",
    "IRatingRepository",
    "IRepository",
    "IUserRepository",
]
