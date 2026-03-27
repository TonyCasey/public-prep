"""Repository implementations module.

Provides SQLAlchemy-based repository implementations for data access.

Includes LINQ-like query builder:
    user = await user_repo.get(lambda x: x.email == email)

    interviews = await interview_repo.query() \\
        .where(lambda x: x.user_id == user_id) \\
        .order_by_desc(lambda x: x.started_at) \\
        .take(10) \\
        .to_list()
"""

from .answer_repository import AnswerRepository
from .base import PaginatedResult, SQLAlchemyRepository
from .document_repository import DocumentRepository
from .interview_repository import InterviewRepository
from .query_builder import QueryBuilder
from .question_repository import QuestionRepository
from .rating_repository import RatingRepository
from .user_repository import UserRepository

__all__ = [
    "AnswerRepository",
    "DocumentRepository",
    "InterviewRepository",
    "PaginatedResult",
    "QueryBuilder",
    "QuestionRepository",
    "RatingRepository",
    "SQLAlchemyRepository",
    "UserRepository",
]
