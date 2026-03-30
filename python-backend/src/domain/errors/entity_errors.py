"""Entity-specific domain errors.

Provides specific error types for each domain entity,
making error handling more precise and informative.
"""

from .base import NotFoundError


class UserNotFoundError(NotFoundError):
    """Raised when a user cannot be found."""

    def __init__(self, user_id: str | None = None, email: str | None = None) -> None:
        if email:
            super().__init__("User", message=f"User with email '{email}' not found")
            self.details["email"] = email
        else:
            super().__init__("User", entity_id=user_id)


class InterviewNotFoundError(NotFoundError):
    """Raised when an interview cannot be found."""

    def __init__(self, interview_id: str) -> None:
        super().__init__("Interview", entity_id=interview_id)


class DocumentNotFoundError(NotFoundError):
    """Raised when a document cannot be found."""

    def __init__(self, document_id: str) -> None:
        super().__init__("Document", entity_id=document_id)


class QuestionNotFoundError(NotFoundError):
    """Raised when a question cannot be found."""

    def __init__(self, question_id: str) -> None:
        super().__init__("Question", entity_id=question_id)


class AnswerNotFoundError(NotFoundError):
    """Raised when an answer cannot be found."""

    def __init__(self, answer_id: str) -> None:
        super().__init__("Answer", entity_id=answer_id)


class RatingNotFoundError(NotFoundError):
    """Raised when a rating cannot be found."""

    def __init__(self, rating_id: str) -> None:
        super().__init__("Rating", entity_id=rating_id)
