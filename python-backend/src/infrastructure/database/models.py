"""SQLAlchemy 2.0 async models matching the existing Drizzle schema.

These models map exactly to the existing PostgreSQL tables created by the
TypeScript/Drizzle ORM backend. No migrations are needed - the schema exists.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


class Session(Base):
    """Session storage table for express-session with connect-pg-simple.

    Maps to: sessions
    """

    __tablename__ = "sessions"

    sid: Mapped[str] = mapped_column(String, primary_key=True)
    sess: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    expire: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (Index("IDX_session_expire", "expire"),)


class User(Base):
    """User accounts with subscription information.

    Maps to: users
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str | None] = mapped_column(String, nullable=True)
    last_name: Mapped[str | None] = mapped_column(String, nullable=True)
    profile_image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    stripe_customer_id: Mapped[str | None] = mapped_column(String, nullable=True)
    subscription_status: Mapped[str | None] = mapped_column(
        String, default="free", nullable=True
    )  # 'free', 'starter', 'premium', 'canceled', 'past_due'
    subscription_id: Mapped[str | None] = mapped_column(String, nullable=True)
    free_answers_used: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    starter_interviews_used: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    starter_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    milestone_sent_70: Mapped[bool | None] = mapped_column(Boolean, default=False, nullable=True)
    milestone_sent_80: Mapped[bool | None] = mapped_column(Boolean, default=False, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )

    # Relationships
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="user")
    questions: Mapped[list["Question"]] = relationship("Question", back_populates="user")
    interviews: Mapped[list["Interview"]] = relationship("Interview", back_populates="user")
    progress: Mapped[list["UserProgress"]] = relationship("UserProgress", back_populates="user")
    backups: Mapped[list["Backup"]] = relationship("Backup", back_populates="user")


class Document(Base):
    """Document uploads (CV, Job Spec).

    Maps to: documents
    """

    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id"), nullable=True
    )
    type: Mapped[str] = mapped_column(Text, nullable=False)  # 'cv' or 'job_spec'
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)  # extracted text content
    analysis: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    uploaded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="documents")


class Interview(Base):
    """Interview sessions.

    Maps to: interviews
    """

    __tablename__ = "interviews"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id"), nullable=True
    )
    session_type: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # 'full', 'competency_focus', 'quick'
    competency_focus: Mapped[list[str] | None] = mapped_column(
        JSONB, nullable=True
    )  # array of competencies
    job_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_grade: Mapped[str | None] = mapped_column(
        Text, default="eo", nullable=True
    )  # co, eo, ao, ap, po, as, ds, sg
    framework: Mapped[str | None] = mapped_column(
        Text, default="old", nullable=True
    )  # 'old' or 'new'
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    current_question_index: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    completed_questions: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    average_score: Mapped[int | None] = mapped_column(Integer, nullable=True)  # out of 10
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)  # in minutes
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool | None] = mapped_column(Boolean, default=True, nullable=True)

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="interviews")
    questions: Mapped[list["Question"]] = relationship("Question", back_populates="interview")
    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="interview")


class Question(Base):
    """Generated questions.

    Maps to: questions
    """

    __tablename__ = "questions"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id"), nullable=True
    )
    interview_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=True
    )
    competency: Mapped[str] = mapped_column(Text, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # 'beginner', 'intermediate', 'advanced'
    generated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="questions")
    interview: Mapped["Interview | None"] = relationship("Interview", back_populates="questions")
    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="question")


class Answer(Base):
    """User answers.

    Maps to: answers
    """

    __tablename__ = "answers"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    interview_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=True
    )
    question_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("questions.id"), nullable=True
    )
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    time_spent: Mapped[int | None] = mapped_column(Integer, nullable=True)  # in seconds
    answered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )

    # Relationships
    interview: Mapped["Interview | None"] = relationship("Interview", back_populates="answers")
    question: Mapped["Question | None"] = relationship("Question", back_populates="answers")
    ratings: Mapped[list["Rating"]] = relationship("Rating", back_populates="answer")


class Rating(Base):
    """AI ratings/evaluations of answers.

    Maps to: ratings
    """

    __tablename__ = "ratings"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    answer_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("answers.id"), nullable=True
    )
    overall_score: Mapped[Decimal] = mapped_column(
        Numeric, nullable=False
    )  # out of 10, allows decimals
    competency_scores: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    star_method_analysis: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    strengths: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    improvement_areas: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    ai_improved_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    evaluation: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    rated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )

    # Relationships
    answer: Mapped["Answer | None"] = relationship("Answer", back_populates="ratings")


class UserProgress(Base):
    """User progress tracking by competency.

    Maps to: user_progress
    """

    __tablename__ = "user_progress"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id"), nullable=True
    )
    competency: Mapped[str] = mapped_column(Text, nullable=False)
    average_score: Mapped[int] = mapped_column(Integer, nullable=False)
    total_questions: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    improvement_rate: Mapped[int | None] = mapped_column(
        Integer, default=0, nullable=True
    )  # percentage
    last_practiced: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="progress")


class Backup(Base):
    """Backup records.

    Maps to: backups
    """

    __tablename__ = "backups"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id"), nullable=True
    )
    backup_data: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    backup_type: Mapped[str] = mapped_column(Text, nullable=False)  # 'auto', 'manual'
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="backups")


class PasswordResetToken(Base):
    """Password reset tokens.

    Maps to: password_reset_tokens
    """

    __tablename__ = "password_reset_tokens"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool | None] = mapped_column(Boolean, default=False, nullable=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )
