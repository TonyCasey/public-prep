"""Domain enumerations for type-safe value representation.

These enums define the allowed values for various domain concepts,
ensuring type safety and consistency throughout the application.
"""

from enum import Enum


class SubscriptionStatus(str, Enum):
    """User subscription status values."""

    FREE = "free"
    STARTER = "starter"
    PREMIUM = "premium"
    CANCELED = "canceled"
    PAST_DUE = "past_due"


class DocumentType(str, Enum):
    """Types of documents that can be uploaded."""

    CV = "cv"
    JOB_SPEC = "job_spec"


class SessionType(str, Enum):
    """Types of interview sessions."""

    FULL = "full"
    COMPETENCY_FOCUS = "competency_focus"
    QUICK = "quick"


class Grade(str, Enum):
    """Civil service grade levels."""

    CO = "co"  # Clerical Officer
    EO = "eo"  # Executive Officer
    AO = "ao"  # Administrative Officer
    AP = "ap"  # Assistant Principal
    PO = "po"  # Principal Officer
    AS = "as"  # Assistant Secretary
    DS = "ds"  # Deputy Secretary
    SG = "sg"  # Secretary General


class Framework(str, Enum):
    """Competency framework versions."""

    OLD = "old"
    NEW = "new"


class Difficulty(str, Enum):
    """Question difficulty levels."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class BackupType(str, Enum):
    """Types of data backups."""

    AUTO = "auto"
    MANUAL = "manual"


class Competency(str, Enum):
    """Interview competencies for assessment.

    These are the core competencies assessed in civil service interviews.
    """

    # Core competencies (old framework)
    LEADERSHIP = "leadership"
    JUDGEMENT = "judgement"
    MANAGEMENT = "management"
    COMMUNICATION = "communication"
    SPECIALIST_KNOWLEDGE = "specialist_knowledge"
    DRIVE_FOR_RESULTS = "drive_for_results"
    INTERPERSONAL_SKILLS = "interpersonal_skills"
    ANALYTICAL_SKILLS = "analytical_skills"

    # New framework competencies
    PEOPLE_MANAGEMENT = "people_management"
    ANALYSIS_AND_DECISION_MAKING = "analysis_and_decision_making"
    DELIVERY_OF_RESULTS = "delivery_of_results"
    INTERPERSONAL_AND_COMMUNICATION = "interpersonal_and_communication"
    SPECIALIST_EXPERTISE = "specialist_expertise"
    DRIVE_AND_COMMITMENT = "drive_and_commitment"

    # Generic/fallback
    GENERAL = "general"
