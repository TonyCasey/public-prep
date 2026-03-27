"""API routes package.

Exports all route modules for FastAPI app registration.
"""

from src.api.routes.ai import router as ai_router
from src.api.routes.answers import router as answers_router
from src.api.routes.auth import router as auth_router
from src.api.routes.documents import router as documents_router
from src.api.routes.interviews import router as interviews_router
from src.api.routes.questions import router as questions_router
from src.api.routes.ratings import router as ratings_router
from src.api.routes.speech import router as speech_router
from src.api.routes.users import router as users_router

__all__ = [
    "ai_router",
    "answers_router",
    "auth_router",
    "documents_router",
    "interviews_router",
    "questions_router",
    "ratings_router",
    "speech_router",
    "users_router",
]
