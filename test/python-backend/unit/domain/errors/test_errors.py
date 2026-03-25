"""Unit tests for domain errors."""

import pytest

from src.domain.errors import (
    AuthenticationError,
    AuthorizationError,
    BusinessRuleError,
    ConflictError,
    DomainError,
    NotFoundError,
    UserNotFoundError,
    InterviewNotFoundError,
    DocumentNotFoundError,
    QuestionNotFoundError,
    AnswerNotFoundError,
    RatingNotFoundError,
    ValidationError,
)


class TestDomainError:
    """Tests for DomainError base class."""

    def test_create_with_message(self) -> None:
        """Should create error with message."""
        error = DomainError("Something went wrong")

        assert str(error) == "Something went wrong"
        assert error.message == "Something went wrong"
        assert error.code == "DomainError"
        assert error.details == {}

    def test_create_with_code_and_details(self) -> None:
        """Should create error with custom code and details."""
        error = DomainError(
            "Error occurred",
            code="CUSTOM_ERROR",
            details={"key": "value"},
        )

        assert error.code == "CUSTOM_ERROR"
        assert error.details == {"key": "value"}

    def test_to_dict(self) -> None:
        """Should convert to dictionary."""
        error = DomainError(
            "Error message",
            code="ERROR_CODE",
            details={"foo": "bar"},
        )

        result = error.to_dict()

        assert result == {
            "error": "ERROR_CODE",
            "message": "Error message",
            "details": {"foo": "bar"},
        }

    def test_repr(self) -> None:
        """Should have useful repr."""
        error = DomainError("Test error", code="TEST")
        assert "DomainError" in repr(error)
        assert "Test error" in repr(error)


class TestValidationError:
    """Tests for ValidationError."""

    def test_create_with_message(self) -> None:
        """Should create with message."""
        error = ValidationError("Invalid input")

        assert error.message == "Invalid input"
        assert error.code == "VALIDATION_ERROR"
        assert error.field is None

    def test_create_with_field(self) -> None:
        """Should include field in details."""
        error = ValidationError("Email is invalid", field="email")

        assert error.field == "email"
        assert error.details["field"] == "email"

    def test_create_with_details(self) -> None:
        """Should merge details with field."""
        error = ValidationError(
            "Invalid",
            field="username",
            details={"min_length": 3},
        )

        assert error.details["field"] == "username"
        assert error.details["min_length"] == 3


class TestNotFoundError:
    """Tests for NotFoundError."""

    def test_create_with_entity_type_only(self) -> None:
        """Should create with entity type."""
        error = NotFoundError("User")

        assert error.entity_type == "User"
        assert error.entity_id is None
        assert error.message == "User not found"

    def test_create_with_entity_id(self) -> None:
        """Should include entity ID in message."""
        error = NotFoundError("User", entity_id="user123")

        assert error.entity_id == "user123"
        assert error.message == "User with id 'user123' not found"
        assert error.details["entity_type"] == "User"
        assert error.details["entity_id"] == "user123"

    def test_create_with_custom_message(self) -> None:
        """Should use custom message."""
        error = NotFoundError("User", message="User does not exist")

        assert error.message == "User does not exist"


class TestEntityNotFoundErrors:
    """Tests for entity-specific NotFoundError subclasses."""

    def test_user_not_found_with_id(self) -> None:
        """Should create UserNotFoundError with ID."""
        error = UserNotFoundError(user_id="user123")

        assert "user123" in error.message
        assert error.entity_type == "User"

    def test_user_not_found_with_email(self) -> None:
        """Should create UserNotFoundError with email."""
        error = UserNotFoundError(email="test@example.com")

        assert "test@example.com" in error.message
        assert error.details["email"] == "test@example.com"

    def test_interview_not_found(self) -> None:
        """Should create InterviewNotFoundError."""
        error = InterviewNotFoundError("interview-123")

        assert "interview-123" in error.message
        assert error.entity_type == "Interview"

    def test_document_not_found(self) -> None:
        """Should create DocumentNotFoundError."""
        error = DocumentNotFoundError("doc-456")

        assert "doc-456" in error.message
        assert error.entity_type == "Document"

    def test_question_not_found(self) -> None:
        """Should create QuestionNotFoundError."""
        error = QuestionNotFoundError("q-789")

        assert "q-789" in error.message
        assert error.entity_type == "Question"

    def test_answer_not_found(self) -> None:
        """Should create AnswerNotFoundError."""
        error = AnswerNotFoundError("ans-101")

        assert "ans-101" in error.message
        assert error.entity_type == "Answer"

    def test_rating_not_found(self) -> None:
        """Should create RatingNotFoundError."""
        error = RatingNotFoundError("rating-202")

        assert "rating-202" in error.message
        assert error.entity_type == "Rating"


class TestAuthenticationError:
    """Tests for AuthenticationError."""

    def test_default_message(self) -> None:
        """Should have default message."""
        error = AuthenticationError()

        assert error.message == "Authentication failed"
        assert error.code == "AUTHENTICATION_ERROR"

    def test_custom_message(self) -> None:
        """Should accept custom message."""
        error = AuthenticationError("Invalid credentials")

        assert error.message == "Invalid credentials"


class TestAuthorizationError:
    """Tests for AuthorizationError."""

    def test_default_message(self) -> None:
        """Should have default message."""
        error = AuthorizationError()

        assert error.message == "Access denied"
        assert error.code == "AUTHORIZATION_ERROR"

    def test_with_action_and_resource(self) -> None:
        """Should include action and resource."""
        error = AuthorizationError(
            "Cannot delete",
            action="delete",
            resource="interview",
        )

        assert error.action == "delete"
        assert error.resource == "interview"
        assert error.details["action"] == "delete"
        assert error.details["resource"] == "interview"


class TestConflictError:
    """Tests for ConflictError."""

    def test_create_with_message(self) -> None:
        """Should create with message."""
        error = ConflictError("Email already exists")

        assert error.message == "Email already exists"
        assert error.code == "CONFLICT_ERROR"

    def test_with_entity_type(self) -> None:
        """Should include entity type."""
        error = ConflictError("Duplicate entry", entity_type="User")

        assert error.entity_type == "User"
        assert error.details["entity_type"] == "User"


class TestBusinessRuleError:
    """Tests for BusinessRuleError."""

    def test_create_with_message(self) -> None:
        """Should create with message."""
        error = BusinessRuleError("Cannot cancel active subscription")

        assert error.message == "Cannot cancel active subscription"
        assert error.code == "BUSINESS_RULE_ERROR"

    def test_with_rule(self) -> None:
        """Should include rule name."""
        error = BusinessRuleError(
            "Exceeded limit",
            rule="max_interviews_per_day",
        )

        assert error.rule == "max_interviews_per_day"
        assert error.details["rule"] == "max_interviews_per_day"


class TestErrorInheritance:
    """Tests for error inheritance."""

    def test_all_errors_inherit_from_domain_error(self) -> None:
        """All errors should inherit from DomainError."""
        errors = [
            ValidationError("test"),
            NotFoundError("Entity"),
            AuthenticationError(),
            AuthorizationError(),
            ConflictError("test"),
            BusinessRuleError("test"),
            UserNotFoundError("id"),
            InterviewNotFoundError("id"),
        ]

        for error in errors:
            assert isinstance(error, DomainError)
            assert isinstance(error, Exception)

    def test_entity_errors_inherit_from_not_found(self) -> None:
        """Entity errors should inherit from NotFoundError."""
        errors = [
            UserNotFoundError("id"),
            InterviewNotFoundError("id"),
            DocumentNotFoundError("id"),
            QuestionNotFoundError("id"),
            AnswerNotFoundError("id"),
            RatingNotFoundError("id"),
        ]

        for error in errors:
            assert isinstance(error, NotFoundError)
