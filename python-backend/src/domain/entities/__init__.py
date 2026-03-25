"""Domain entities module.

Contains the core business entities of the application.
These are pure Python dataclasses with no external dependencies.
"""

from .answer import Answer
from .document import Document
from .interview import Interview
from .question import Question
from .rating import Rating
from .user import User
from .user_progress import UserProgress

__all__ = [
    "Answer",
    "Document",
    "Interview",
    "Question",
    "Rating",
    "User",
    "UserProgress",
]
