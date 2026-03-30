"""Irish Public Service Grade Configuration.

Defines grade levels and their characteristics for interview assessment.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Literal


class QuestionComplexity(str, Enum):
    """Question complexity levels."""

    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


@dataclass(frozen=True)
class GradeConfig:
    """Configuration for a public service grade.

    Attributes:
        id: Short grade identifier (e.g., 'heo')
        name: Grade abbreviation (e.g., 'HEO')
        full_name: Full grade title
        level: Numeric level (1=lowest, 9=highest)
        passing_score: Minimum percentage to pass
        question_complexity: Complexity level for questions
        experience_expectation: Description of expected experience
        typical_responsibilities: List of typical duties
        salary_min: Minimum salary (optional)
        salary_max: Maximum salary (optional)
    """

    id: str
    name: str
    full_name: str
    level: int
    passing_score: int
    question_complexity: QuestionComplexity
    experience_expectation: str
    typical_responsibilities: tuple[str, ...]
    salary_min: int | None = None
    salary_max: int | None = None


# All Irish Public Service grades
GRADES: dict[str, GradeConfig] = {
    "co": GradeConfig(
        id="co",
        name="CO",
        full_name="Clerical Officer",
        level=1,
        passing_score=55,
        question_complexity=QuestionComplexity.BASIC,
        experience_expectation="The starting point for many, often requiring a Leaving Certificate or equivalent",
        typical_responsibilities=(
            "General administrative duties",
            "Processing applications and forms",
            "Maintaining records and databases",
            "Providing information to the public",
            "Supporting team operations",
        ),
        salary_min=28000,
        salary_max=35000,
    ),
    "eo": GradeConfig(
        id="eo",
        name="EO",
        full_name="Executive Officer",
        level=2,
        passing_score=60,
        question_complexity=QuestionComplexity.INTERMEDIATE,
        experience_expectation="A first-level management role, requiring further qualifications and experience",
        typical_responsibilities=(
            "Managing workflows and processes",
            "Supervising clerical staff",
            "Drafting correspondence and reports",
            "Making operational decisions",
            "Implementing policies and procedures",
        ),
        salary_min=35000,
        salary_max=45000,
    ),
    "heo": GradeConfig(
        id="heo",
        name="HEO",
        full_name="Higher Executive Officer",
        level=3,
        passing_score=65,
        question_complexity=QuestionComplexity.ADVANCED,
        experience_expectation="A middle management role with responsibility for team management, reporting to Assistant Principal and supporting large projects, budgets and policy development",
        typical_responsibilities=(
            "Team management and leadership",
            "Managing large projects and coordinating initiatives",
            "Budget management and oversight",
            "Developing and implementing government policy",
            "Advising and interacting with senior management",
            "Driving organizational change",
            "Supporting Assistant Principal in organizational goals",
        ),
        salary_min=58264,
        salary_max=70000,
    ),
    "ao": GradeConfig(
        id="ao",
        name="AO",
        full_name="Administrative Officer",
        level=4,
        passing_score=65,
        question_complexity=QuestionComplexity.ADVANCED,
        experience_expectation="A management role with more responsibility than EO, often involving analysis and policy advice",
        typical_responsibilities=(
            "Management with increased responsibility",
            "Policy analysis and advice",
            "Strategic planning",
            "Budget oversight",
            "Cross-functional collaboration",
            "Team leadership",
        ),
        salary_min=50000,
        salary_max=68000,
    ),
    "ap": GradeConfig(
        id="ap",
        name="AP",
        full_name="Assistant Principal",
        level=5,
        passing_score=70,
        question_complexity=QuestionComplexity.EXPERT,
        experience_expectation="A senior managerial role with responsibilities in policy implementation, team leadership, and stakeholder management",
        typical_responsibilities=(
            "Senior managerial responsibilities",
            "Policy implementation",
            "Team leadership",
            "Stakeholder management",
            "Strategic decision making",
            "Organizational change management",
        ),
        salary_min=68000,
        salary_max=85000,
    ),
    "po": GradeConfig(
        id="po",
        name="PO",
        full_name="Principal Officer",
        level=6,
        passing_score=75,
        question_complexity=QuestionComplexity.EXPERT,
        experience_expectation="A higher-level management role, potentially with responsibility for larger teams and more complex policy areas",
        typical_responsibilities=(
            "Higher-level management",
            "Larger team responsibility",
            "Complex policy areas",
            "Strategic policy development",
            "Ministerial briefings",
            "Cross-departmental collaboration",
        ),
        salary_min=85000,
        salary_max=105000,
    ),
    "as": GradeConfig(
        id="as",
        name="AS",
        full_name="Assistant Secretary",
        level=7,
        passing_score=80,
        question_complexity=QuestionComplexity.EXPERT,
        experience_expectation="A senior leadership position with strategic responsibilities",
        typical_responsibilities=(
            "Senior leadership position",
            "Strategic responsibilities",
            "Departmental oversight",
            "Policy development leadership",
            "Government advisory role",
            "Major reform initiatives",
        ),
        salary_min=105000,
        salary_max=130000,
    ),
    "ds": GradeConfig(
        id="ds",
        name="DS",
        full_name="Deputy Secretary",
        level=8,
        passing_score=85,
        question_complexity=QuestionComplexity.EXPERT,
        experience_expectation="A high-ranking position within a department, overseeing multiple divisions or policy areas",
        typical_responsibilities=(
            "High-ranking departmental position",
            "Multiple division oversight",
            "Policy area leadership",
            "Strategic departmental planning",
            "Inter-departmental coordination",
            "Executive leadership",
        ),
        salary_min=130000,
        salary_max=160000,
    ),
    "sg": GradeConfig(
        id="sg",
        name="SG",
        full_name="Secretary General",
        level=9,
        passing_score=90,
        question_complexity=QuestionComplexity.EXPERT,
        experience_expectation="The most senior position in a government department, responsible for overall management and strategic direction",
        typical_responsibilities=(
            "Most senior departmental position",
            "Overall management responsibility",
            "Strategic direction",
            "Government policy leadership",
            "Ministerial advisory role",
            "Departmental transformation",
        ),
        salary_min=160000,
        salary_max=200000,
    ),
}


def get_grade_by_id(grade_id: str) -> GradeConfig | None:
    """Get grade configuration by ID.

    Args:
        grade_id: Grade identifier (e.g., 'heo')

    Returns:
        GradeConfig if found, None otherwise
    """
    return GRADES.get(grade_id.lower())


def get_grade_names() -> list[str]:
    """Get list of all grade abbreviations."""
    return [g.name for g in GRADES.values()]


def get_default_grade() -> str:
    """Get the default grade ID."""
    return "eo"


def get_question_count_for_grade(grade_id: str) -> int:
    """Get recommended question count for a grade.

    Args:
        grade_id: Grade identifier

    Returns:
        Number of questions appropriate for the grade
    """
    grade = get_grade_by_id(grade_id)
    if not grade:
        return 12

    if grade.level <= 2:
        return 8
    elif grade.level == 3:
        return 10
    elif grade.level <= 5:
        return 12
    else:
        return 14


def get_interview_duration_for_grade(grade_id: str) -> int:
    """Get recommended interview duration in minutes.

    Args:
        grade_id: Grade identifier

    Returns:
        Duration in minutes (2 minutes per question)
    """
    return get_question_count_for_grade(grade_id) * 2
