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
from .grade_config import (
    GRADES,
    GradeConfig,
    QuestionComplexity,
    get_default_grade,
    get_grade_by_id,
    get_grade_names,
    get_interview_duration_for_grade,
    get_question_count_for_grade,
)

__all__ = [
    "BackupType",
    "Competency",
    "Difficulty",
    "DocumentType",
    "Framework",
    "Grade",
    "GradeConfig",
    "GRADES",
    "QuestionComplexity",
    "SessionType",
    "SubscriptionStatus",
    "get_default_grade",
    "get_grade_by_id",
    "get_grade_names",
    "get_interview_duration_for_grade",
    "get_question_count_for_grade",
]
