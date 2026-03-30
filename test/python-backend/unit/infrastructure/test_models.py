"""Unit tests for SQLAlchemy database models.

Tests model definitions, column presence, and table metadata.
"""

import pytest

from src.infrastructure.database.models import (
    Answer,
    Backup,
    Base,
    Document,
    Interview,
    PasswordResetToken,
    Question,
    Rating,
    Session,
    User,
    UserProgress,
)


class TestBase:
    """Tests for SQLAlchemy Base class."""

    def test_has_metadata(self) -> None:
        """Should have metadata with all tables."""
        # Assert
        assert Base.metadata is not None
        assert len(Base.metadata.tables) == 10


class TestSessionModel:
    """Tests for Session model."""

    def test_tablename(self) -> None:
        """Should have correct table name."""
        assert Session.__tablename__ == "sessions"

    def test_has_required_columns(self) -> None:
        """Should have all required columns."""
        columns = {col.name for col in Session.__table__.columns}
        assert columns == {"sid", "sess", "expire"}

    def test_primary_key(self) -> None:
        """Should have sid as primary key."""
        pk_columns = [col.name for col in Session.__table__.primary_key.columns]
        assert pk_columns == ["sid"]


class TestUserModel:
    """Tests for User model."""

    def test_tablename(self) -> None:
        """Should have correct table name."""
        assert User.__tablename__ == "users"

    def test_has_required_columns(self) -> None:
        """Should have all required columns."""
        columns = {col.name for col in User.__table__.columns}
        expected = {
            "id", "email", "password", "first_name", "last_name",
            "profile_image_url", "stripe_customer_id", "subscription_status",
            "subscription_id", "free_answers_used", "starter_interviews_used",
            "starter_expires_at", "milestone_sent_70", "milestone_sent_80",
            "created_at", "updated_at"
        }
        assert columns == expected

    def test_email_is_unique(self) -> None:
        """Should have unique constraint on email."""
        email_col = User.__table__.columns["email"]
        assert email_col.unique is True

    def test_has_relationships(self) -> None:
        """Should have relationship to other models."""
        assert hasattr(User, "documents")
        assert hasattr(User, "interviews")
        assert hasattr(User, "questions")


class TestDocumentModel:
    """Tests for Document model."""

    def test_tablename(self) -> None:
        """Should have correct table name."""
        assert Document.__tablename__ == "documents"

    def test_has_required_columns(self) -> None:
        """Should have all required columns."""
        columns = {col.name for col in Document.__table__.columns}
        expected = {"id", "user_id", "type", "filename", "content", "analysis", "uploaded_at"}
        assert columns == expected

    def test_has_user_relationship(self) -> None:
        """Should have relationship to User."""
        assert hasattr(Document, "user")


class TestInterviewModel:
    """Tests for Interview model."""

    def test_tablename(self) -> None:
        """Should have correct table name."""
        assert Interview.__tablename__ == "interviews"

    def test_has_required_columns(self) -> None:
        """Should have all required columns."""
        columns = {col.name for col in Interview.__table__.columns}
        expected = {
            "id", "user_id", "session_type", "competency_focus", "job_title",
            "job_grade", "framework", "total_questions", "current_question_index",
            "completed_questions", "average_score", "duration", "started_at",
            "completed_at", "is_active"
        }
        assert columns == expected


class TestQuestionModel:
    """Tests for Question model."""

    def test_tablename(self) -> None:
        """Should have correct table name."""
        assert Question.__tablename__ == "questions"

    def test_has_required_columns(self) -> None:
        """Should have all required columns."""
        columns = {col.name for col in Question.__table__.columns}
        expected = {
            "id", "user_id", "interview_id", "competency",
            "question_text", "difficulty", "generated_at"
        }
        assert columns == expected


class TestAnswerModel:
    """Tests for Answer model."""

    def test_tablename(self) -> None:
        """Should have correct table name."""
        assert Answer.__tablename__ == "answers"

    def test_has_required_columns(self) -> None:
        """Should have all required columns."""
        columns = {col.name for col in Answer.__table__.columns}
        expected = {"id", "interview_id", "question_id", "answer_text", "time_spent", "answered_at"}
        assert columns == expected


class TestRatingModel:
    """Tests for Rating model."""

    def test_tablename(self) -> None:
        """Should have correct table name."""
        assert Rating.__tablename__ == "ratings"

    def test_has_required_columns(self) -> None:
        """Should have all required columns."""
        columns = {col.name for col in Rating.__table__.columns}
        expected = {
            "id", "answer_id", "overall_score", "competency_scores",
            "star_method_analysis", "feedback", "strengths",
            "improvement_areas", "ai_improved_answer", "evaluation", "rated_at"
        }
        assert columns == expected


class TestUserProgressModel:
    """Tests for UserProgress model."""

    def test_tablename(self) -> None:
        """Should have correct table name."""
        assert UserProgress.__tablename__ == "user_progress"

    def test_has_required_columns(self) -> None:
        """Should have all required columns."""
        columns = {col.name for col in UserProgress.__table__.columns}
        expected = {
            "id", "user_id", "competency", "average_score",
            "total_questions", "improvement_rate", "last_practiced", "updated_at"
        }
        assert columns == expected


class TestBackupModel:
    """Tests for Backup model."""

    def test_tablename(self) -> None:
        """Should have correct table name."""
        assert Backup.__tablename__ == "backups"

    def test_has_required_columns(self) -> None:
        """Should have all required columns."""
        columns = {col.name for col in Backup.__table__.columns}
        expected = {"id", "user_id", "backup_data", "backup_type", "created_at"}
        assert columns == expected


class TestPasswordResetTokenModel:
    """Tests for PasswordResetToken model."""

    def test_tablename(self) -> None:
        """Should have correct table name."""
        assert PasswordResetToken.__tablename__ == "password_reset_tokens"

    def test_has_required_columns(self) -> None:
        """Should have all required columns."""
        columns = {col.name for col in PasswordResetToken.__table__.columns}
        expected = {"id", "token", "email", "expires_at", "used", "used_at", "created_at"}
        assert columns == expected

    def test_token_is_unique(self) -> None:
        """Should have unique constraint on token."""
        token_col = PasswordResetToken.__table__.columns["token"]
        assert token_col.unique is True
