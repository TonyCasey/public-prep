"""Domain errors module.

Provides a hierarchy of domain-specific exceptions for clean error handling.
"""

from .base import (
    AuthenticationError,
    AuthorizationError,
    BusinessRuleError,
    ConflictError,
    DomainError,
    NotFoundError,
    ValidationError,
)
from .entity_errors import (
    AnswerNotFoundError,
    DocumentNotFoundError,
    InterviewNotFoundError,
    QuestionNotFoundError,
    RatingNotFoundError,
    UserNotFoundError,
)

__all__ = [
    # Base errors
    "DomainError",
    "ValidationError",
    "NotFoundError",
    "AuthenticationError",
    "AuthorizationError",
    "ConflictError",
    "BusinessRuleError",
    # Entity-specific errors
    "UserNotFoundError",
    "InterviewNotFoundError",
    "DocumentNotFoundError",
    "QuestionNotFoundError",
    "AnswerNotFoundError",
    "RatingNotFoundError",
]
