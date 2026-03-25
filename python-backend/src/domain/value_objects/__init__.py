"""Domain value objects - immutable types with no identity.

Value objects are distinguished by their attributes rather than identity.
They should be immutable and comparable by value.
"""

from .enums import (
    BackupType,
    Competency,
    Difficulty,
    DocumentType,
    Framework,
    Grade,
    SessionType,
    SubscriptionStatus,
)

__all__ = [
    "BackupType",
    "Competency",
    "Difficulty",
    "DocumentType",
    "Framework",
    "Grade",
    "SessionType",
    "SubscriptionStatus",
]
