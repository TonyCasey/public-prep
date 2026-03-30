"""Anthropic AI service implementation.

Provides AI-powered interview assistance using Claude.
"""

import json
import logging
import re
from typing import Any, Literal

from anthropic import AsyncAnthropic

from src.application.interfaces.ai_service import AIServiceError, IAIService
from src.domain.value_objects.grade_config import get_grade_by_id

logger = logging.getLogger(__name__)

# Latest Claude model
DEFAULT_MODEL = "claude-sonnet-4-20250514"


def _truncate_text(text: str, max_tokens: int) -> str:
    """Truncate text to stay within token limits.

    Args:
        text: Text to truncate
        max_tokens: Maximum tokens (rough estimate: 1 token ≈ 4 chars)

    Returns:
        Truncated text with indicator if truncated
    """
    max_chars = max_tokens * 4
    if len(text) <= max_chars:
        return text

    return text[:max_chars] + "\n\n[Note: Content has been truncated to fit processing limits]"


def _clean_json_response(response_text: str) -> str:
    """Clean markdown code blocks from JSON response.

    Args:
        response_text: Raw response text

    Returns:
        Cleaned JSON string
    """
    if "```json" in response_text:
        response_text = re.sub(r"```json\s*", "", response_text)
        response_text = re.sub(r"```\s*$", "", response_text)
    elif "```" in response_text:
        response_text = re.sub(r"```\s*", "", response_text)
        response_text = re.sub(r"```\s*$", "", response_text)

    return response_text.strip()


class AnthropicAIService(IAIService):
    """Anthropic Claude implementation of AI service."""

    def __init__(self, api_key: str) -> None:
        """Initialize Anthropic AI service.

        Args:
            api_key: Anthropic API key
        """
        self._client = AsyncAnthropic(api_key=api_key)

    async def analyze_cv(
        self,
        cv_text: str,
        job_spec_text: str | None = None,
    ) -> dict[str, Any]:
        """Analyze a CV against competency framework."""
        try:
            truncated_cv = _truncate_text(cv_text, 15000)
            truncated_job_spec = _truncate_text(job_spec_text, 3000) if job_spec_text else None

            prompt = f"""IMPORTANT: Analyze ONLY the information that is explicitly present in this CV. Do not make assumptions or add information that is not clearly stated.

CV Content: {truncated_cv}

{f'Job Specification Context: {truncated_job_spec}' if truncated_job_spec else ''}

Analyze against the 6 HEO competencies based ONLY on evidence found in the CV:
1. Team Leadership
2. Judgement, Analysis & Decision Making
3. Management & Delivery of Results
4. Interpersonal & Communication Skills
5. Specialist Knowledge, Expertise and Self Development
6. Drive & Commitment

CRITICAL RULES:
- Only extract information that is explicitly mentioned in the CV
- Do not assume or infer anything beyond what is written
- Use IRISH terminology: "Public sector" = government/state/civil service, "Private sector" = privately-owned companies
- If no Irish public sector experience is mentioned, set publicSectorExperience to false
- Base competency scores only on clear evidence from the CV content
- If insufficient evidence exists for a competency, score it lower
- Do not confuse private company experience with public sector experience

IRISH PUBLIC SECTOR DEFINITION:
- Government departments, civil service, local authorities, HSE, Garda, education sector
- State agencies, semi-state bodies, public service organizations
- NOT private companies, commercial businesses, or privately-owned entities

Provide analysis in JSON format with:
- keyHighlights: array of 3-5 key strengths that are ACTUALLY mentioned in the CV (do NOT mention public sector unless explicitly stated)
- competencyStrengths: object with competency names as keys and evidence-based scores 0-100
- improvementAreas: array of 2-3 areas where CV shows gaps or lacks evidence
- experienceLevel: "entry", "mid", or "senior" based on years/level of experience stated
- publicSectorExperience: boolean (true ONLY if CV explicitly mentions Irish government, civil service, public sector, HSE, local authorities, or specific state agencies)

IMPORTANT: Return ONLY valid JSON. Do not include any explanatory text, markdown formatting, or code blocks. Start your response directly with {{ and end with }}."""

            response = await self._client.messages.create(
                model=DEFAULT_MODEL,
                max_tokens=2000,
                system="You are an expert in Irish Public Service recruitment and HEO competency assessment. Return ONLY valid JSON without any markdown formatting or explanatory text.",
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = ""
            if response.content and response.content[0].type == "text":
                response_text = response.content[0].text or "{}"
            else:
                response_text = "{}"

            cleaned = _clean_json_response(response_text)
            return json.loads(cleaned)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse CV analysis response: {e}")
            raise AIServiceError(f"Failed to parse CV analysis: {e}", e)
        except Exception as e:
            logger.error(f"CV analysis failed: {e}")
            raise AIServiceError(f"Failed to analyze CV: {e}", e)

    async def generate_questions(
        self,
        cv_analysis: dict[str, Any],
        job_spec_text: str | None = None,
        focus_competencies: list[str] | None = None,
        total_questions: int = 12,
        framework: Literal["old", "new"] = "old",
        grade: str = "heo",
    ) -> dict[str, Any]:
        """Generate interview questions based on CV analysis."""
        try:
            grade_config = get_grade_by_id(grade)
            if not grade_config:
                raise AIServiceError(f"Invalid grade: {grade}")

            questions_per_competency = 2
            actual_total = (
                len(focus_competencies) * questions_per_competency
                if focus_competencies
                else total_questions
            )

            competency_focus = (
                f"Focus ONLY on these competencies: {', '.join(focus_competencies)}"
                if focus_competencies
                else ""
            )

            truncated_job_spec = _truncate_text(job_spec_text, 2000) if job_spec_text else None

            questions_per_unit = 2 if framework == "old" else 3
            competency_label = "competency" if framework == "old" else "capability_area"

            # Build competency guidance based on framework
            if framework == "old":
                competency_guidance = self._build_old_framework_guidance(grade_config, questions_per_unit)
            else:
                competency_guidance = self._build_new_framework_guidance(grade_config, questions_per_unit)

            prompt = f"""Generate {actual_total} interview questions for an Irish Public Service {grade_config.name} ({grade_config.full_name}) position using the {'Traditional' if framework == 'old' else 'New'} Framework.

GRADE DETAILS:
- Grade: {grade_config.name} - {grade_config.full_name}
- Level: {grade_config.level} of 9 (1=lowest, 9=highest)
- Expected Experience: {grade_config.experience_expectation}
- Question Complexity: {grade_config.question_complexity.value}
- Typical Responsibilities: {', '.join(grade_config.typical_responsibilities)}

CV Analysis: {json.dumps(cv_analysis)}
{f'Job Specification: {truncated_job_spec}' if truncated_job_spec else ''}
{competency_focus}

{competency_guidance}

IMPORTANT REQUIREMENTS:
- Generate EXACTLY {questions_per_unit} questions per {competency_label}
- Questions can be presented in ANY ORDER (mixed {competency_label}s)
- Each question should test different aspects of the same {competency_label}
- Questions should be tailored to the candidate's experience level and background
- All questions must be suitable for STAR method responses
- Mix question difficulty appropriately
- Questions should be realistic for Irish Public Service context
- Include Irish government terminology (Department, Minister, Oireachtas, etc.)
- Reference typical Irish public sector scenarios (parliamentary questions, FOI requests, etc.)
- Consider cross-departmental collaboration and citizen service delivery

Provide response in JSON format with:
- questions: array of question objects with id, competency, questionText, difficulty, focusAreas (randomize the order)
- totalQuestions: number (should equal {actual_total})
- competencyDistribution: object showing exactly {questions_per_unit} questions per {competency_label}"""

            response = await self._client.messages.create(
                model=DEFAULT_MODEL,
                max_tokens=2000,
                system=f"You are an expert in Irish Public Service recruitment and {grade_config.name} competency-based interviewing. Generate realistic questions that properly assess {grade_config.name}-level capabilities, appropriate for someone with {grade_config.experience_expectation}.",
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = ""
            if response.content and response.content[0].type == "text":
                response_text = response.content[0].text or "{}"
            else:
                response_text = "{}"

            cleaned = _clean_json_response(response_text)
            return json.loads(cleaned)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse question generation response: {e}")
            raise AIServiceError(f"Failed to parse questions: {e}", e)
        except AIServiceError:
            raise
        except Exception as e:
            logger.error(f"Question generation failed: {e}")
            raise AIServiceError(f"Failed to generate questions: {e}", e)

    def _build_old_framework_guidance(self, grade_config, questions_per_unit: int) -> str:
        """Build competency guidance for old framework."""
        level = grade_config.level

        if level <= 2:
            team = "Supporting team activities, following instructions, collaborating with colleagues"
            judgement = "Following procedures, basic problem solving, escalating issues appropriately"
            management = "Completing tasks efficiently, meeting deadlines, maintaining quality standards"
            interpersonal = "Customer service, clear communication, professional relationships"
            specialist = "Understanding role requirements, learning procedures, developing skills"
            drive = "Reliability, following through on tasks, positive attitude"
        elif level <= 4:
            team = "Works with team to facilitate high performance, develops clear objectives, addresses performance issues"
            judgement = "Gathers and analyzes information, weighs critical factors, makes sound decisions"
            management = "Takes responsibility for objectives, manages multiple projects, delegates effectively"
            interpersonal = "Builds stakeholder contacts, acts as effective link, presents information clearly"
            specialist = "High expertise and public sector knowledge, focuses on self-development"
            drive = "Strives for high performance, demonstrates resilience, upholds high standards"
        else:
            team = "Strategic team leadership, organizational culture change, divisional management"
            judgement = "Strategic decision making, policy formulation, ministerial advisory"
            management = "Divisional performance management, major reform delivery, cross-department coordination"
            interpersonal = "Executive communication, international representation, media engagement"
            specialist = "Expert advisory, thought leadership, organizational capability building"
            drive = "Executive leadership, organizational transformation, public service ethos"

        return f"""{grade_config.name} Competencies (Traditional Framework - generate {questions_per_unit} questions for each):
1. Team Leadership - {team}
2. Judgement, Analysis & Decision Making - {judgement}
3. Management & Delivery of Results - {management}
4. Interpersonal & Communication Skills - {interpersonal}
5. Specialist Knowledge, Expertise and Self Development - {specialist}
6. Drive & Commitment - {drive}"""

    def _build_new_framework_guidance(self, grade_config, questions_per_unit: int) -> str:
        """Build competency guidance for new framework."""
        level = grade_config.level

        if level <= 3:
            future = "Basic digital skills, adapting to change, continuous learning"
            leading = "Supporting colleagues, contributing ideas, taking initiative"
            evidence = "Following processes, basic analysis, quality focus"
            communicating = "Clear communication, teamwork, customer focus"
        else:
            future = "Digital Focus, Innovation & Upskilling for the Future; Strategic Awareness & Change"
            leading = "Leading, Motivating & Developing; Leading with Specialist Insight"
            evidence = "Delivering Excellence; Analysis, Judgement & Decision Making"
            communicating = "Communicating & Influencing; Engaging & Collaborating"

        return f"""{grade_config.name} Capability Areas (New Framework - generate {questions_per_unit} questions for each):
1. Building Future Readiness - {future}
2. Leading and Empowering - {leading}
3. Evidence Informed Delivery - {evidence}
4. Communicating and Collaborating - {communicating}"""

    async def evaluate_answer(
        self,
        question_text: str,
        answer_text: str,
        competency: str,
        cv_context: str | None = None,
    ) -> dict[str, Any]:
        """Evaluate an interview answer using STAR method."""
        try:
            prompt = f"""Evaluate this interview answer for an Irish Public Service HEO position using the official HEO competency framework.

Question: {question_text}
Answer: {answer_text}
Primary Competency: {competency}
{f'Candidate Background: {cv_context}' if cv_context else ''}

Competency Performance Indicators:
- Team Leadership: Facilitates high performance, develops objectives, addresses issues, provides clear information, leads by example, focuses on development
- Judgement, Analysis & Decision Making: Gathers/analyzes information, weighs factors, considers broader issues, uses experience, makes sound decisions, provides solutions
- Management & Delivery of Results: Takes responsibility, manages multiple projects, organizes effectively, delivers with resources, delegates effectively, identifies improvements
- Interpersonal & Communication Skills: Builds contacts, acts as effective link, encourages discussions, projects conviction, treats with respect, presents clearly
- Specialist Knowledge, Expertise and Self Development: Understands roles/objectives, has expertise and public sector knowledge, focuses on self-development
- Drive & Commitment: Strives for high performance, demonstrates resilience, is trustworthy, ensures customer focus, upholds standards

Evaluate using STAR method analysis:
- Situation: Clear context and background (0-10)
- Task: Specific responsibility/challenge (0-10)
- Action: Detailed steps taken with personal involvement (0-10)
- Result: Measurable outcomes and impact (0-10)

Provide evaluation in JSON format with:
- overallScore: number 0-10
- competencyScores: object with all 6 competencies and scores 0-10
- feedback: detailed constructive feedback string (format with multiple paragraphs separated by double newlines \\n\\n for readability)
- strengths: array of 2-3 brief strengths (2-3 words each, e.g. "Clear structure", "Good metrics")
- improvementAreas: array of 2-3 brief improvement areas (2-3 words each, e.g. "More stakeholders", "Risk mitigation")
- improvedAnswer: enhanced version of the answer formatted with explicit STAR method headings. Start each section with "Situation:", "Task:", "Action:", and "Result:" on separate lines. Include better public sector context and competency alignment
- cvSuggestedAnswer: (only if CV context provided) a completely different example answer based on the candidate's CV experiences that would be more suitable for this question. Use explicit STAR headings and draw from different experiences mentioned in their CV
- starMethodAnalysis: object with situation, task, action, result scores 0-10

Focus on:
- Specific examples and evidence
- Quantifiable results where possible
- Leadership and decision-making demonstrated
- Public sector context understanding
- Performance indicator coverage"""

            response = await self._client.messages.create(
                model=DEFAULT_MODEL,
                max_tokens=2000,
                system="You are an expert Irish Public Service interviewer and HEO competency assessor. Provide detailed, fair, and constructive evaluation based on official HEO performance indicators.",
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = ""
            if response.content and response.content[0].type == "text":
                response_text = response.content[0].text or "{}"
            else:
                response_text = "{}"

            cleaned = _clean_json_response(response_text)
            return json.loads(cleaned)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse answer evaluation response: {e}")
            raise AIServiceError(f"Failed to parse evaluation: {e}", e)
        except Exception as e:
            logger.error(f"Answer evaluation failed: {e}")
            raise AIServiceError(f"Failed to evaluate answer: {e}", e)

    async def generate_sample_answer(
        self,
        question_text: str,
        competency: str,
        experience_level: Literal["entry", "mid", "senior"] = "mid",
    ) -> dict[str, Any]:
        """Generate a high-scoring sample answer."""
        try:
            prompt = f"""Generate a high-scoring sample answer for this Irish Public Service HEO interview question.

Question: {question_text}
Primary Competency: {competency}
Experience Level: {experience_level}

Requirements:
- Use STAR method structure
- Demonstrate HEO-level competency performance indicators
- Include specific, realistic examples from Irish public service context
- Show measurable results and outcomes
- Target score of 8-9 out of 10
- Be authentic and realistic for the experience level

Provide response in JSON format with:
- sampleAnswer: comprehensive answer text using STAR method
- explanation: breakdown of why this answer scores highly
- score: expected score out of 10

Make the example relevant to Irish public service and demonstrate clear understanding of {competency} competency requirements."""

            response = await self._client.messages.create(
                model=DEFAULT_MODEL,
                max_tokens=2000,
                system="You are an expert in Irish Public Service HEO competency demonstration and high-scoring interview responses. Create realistic, high-quality sample answers.",
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = ""
            if response.content and response.content[0].type == "text":
                response_text = response.content[0].text or "{}"
            else:
                response_text = "{}"

            cleaned = _clean_json_response(response_text)
            return json.loads(cleaned)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse sample answer response: {e}")
            raise AIServiceError(f"Failed to parse sample answer: {e}", e)
        except Exception as e:
            logger.error(f"Sample answer generation failed: {e}")
            raise AIServiceError(f"Failed to generate sample answer: {e}", e)
