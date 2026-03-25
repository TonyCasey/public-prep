"""Base domain error classes.

All domain errors inherit from DomainError, providing a consistent
error handling pattern across the application.
"""

from typing import Any


class DomainError(Exception):
    """Base class for all domain errors.

    Attributes:
        message: Human-readable error message
        code: Machine-readable error code
        details: Additional error context
    """

    def __init__(
        self,
        message: str,
        code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code or self.__class__.__name__
        self.details = details or {}

    def __str__(self) -> str:
        return self.message

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(message={self.message!r}, code={self.code!r})"

    def to_dict(self) -> dict[str, Any]:
        """Convert error to dictionary for API responses."""
        return {
            "error": self.code,
            "message": self.message,
            "details": self.details,
        }


class ValidationError(DomainError):
    """Raised when input validation fails.

    Use this for business rule violations and invalid data.
    """

    def __init__(
        self,
        message: str,
        field: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        details = details or {}
        if field:
            details["field"] = field
        super().__init__(message, code="VALIDATION_ERROR", details=details)
        self.field = field


class NotFoundError(DomainError):
    """Raised when a requested entity does not exist.

    Use this for missing database records or resources.
    """

    def __init__(
        self,
        entity_type: str,
        entity_id: str | None = None,
        message: str | None = None,
    ) -> None:
        self.entity_type = entity_type
        self.entity_id = entity_id

        if message is None:
            if entity_id:
                message = f"{entity_type} with id '{entity_id}' not found"
            else:
                message = f"{entity_type} not found"

        super().__init__(
            message,
            code="NOT_FOUND",
            details={"entity_type": entity_type, "entity_id": entity_id},
        )


class AuthenticationError(DomainError):
    """Raised when authentication fails.

    Use this for invalid credentials, expired tokens, etc.
    """

    def __init__(
        self,
        message: str = "Authentication failed",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code="AUTHENTICATION_ERROR", details=details)


class AuthorizationError(DomainError):
    """Raised when user lacks permission for an action.

    Use this for access control violations.
    """

    def __init__(
        self,
        message: str = "Access denied",
        action: str | None = None,
        resource: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        details = details or {}
        if action:
            details["action"] = action
        if resource:
            details["resource"] = resource
        super().__init__(message, code="AUTHORIZATION_ERROR", details=details)
        self.action = action
        self.resource = resource


class ConflictError(DomainError):
    """Raised when an operation conflicts with existing state.

    Use this for duplicate entries, concurrent modifications, etc.
    """

    def __init__(
        self,
        message: str,
        entity_type: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        details = details or {}
        if entity_type:
            details["entity_type"] = entity_type
        super().__init__(message, code="CONFLICT_ERROR", details=details)
        self.entity_type = entity_type


class BusinessRuleError(DomainError):
    """Raised when a business rule is violated.

    Use this for domain-specific rule violations that don't fit other categories.
    """

    def __init__(
        self,
        message: str,
        rule: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        details = details or {}
        if rule:
            details["rule"] = rule
        super().__init__(message, code="BUSINESS_RULE_ERROR", details=details)
        self.rule = rule
