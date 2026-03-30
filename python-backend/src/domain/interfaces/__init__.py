"""Domain interfaces module.

Contains repository interfaces following the Repository pattern.
These interfaces define contracts for data access, allowing
infrastructure implementations to be swapped without affecting
the domain layer.
"""

from .answer_repository import IAnswerRepository
from .document_repository import IDocumentRepository
from .interview_repository import IInterviewRepository
from .question_repository import IQuestionRepository
from .rating_repository import IRatingRepository
from .repository import IRepository
from .user_repository import IUserRepository

__all__ = [
    "IRepository",
    "IUserRepository",
    "IInterviewRepository",
    "IDocumentRepository",
    "IQuestionRepository",
    "IAnswerRepository",
    "IRatingRepository",
]
