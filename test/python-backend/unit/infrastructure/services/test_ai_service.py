"""Unit tests for AnthropicAIService.

Tests AI service with mocked Anthropic client.
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.application.interfaces.ai_service import AIServiceError
from src.infrastructure.services.ai_service import AnthropicAIService


@pytest.fixture
def mock_anthropic_response():
    """Create a mock Anthropic message response."""

    def _create_response(content: dict):
        response = MagicMock()
        text_block = MagicMock()
        text_block.type = "text"
        text_block.text = json.dumps(content)
        response.content = [text_block]
        return response

    return _create_response


@pytest.fixture
def ai_service():
    """Create AI service with test API key."""
    return AnthropicAIService(api_key="test-api-key")


class TestAnalyzeCV:
    """Tests for AnthropicAIService.analyze_cv method."""

    @pytest.mark.asyncio
    async def test_analyzes_cv_successfully(
        self, ai_service: AnthropicAIService, mock_anthropic_response
    ) -> None:
        """Should return CV analysis from API response."""
        expected_result = {
            "keyHighlights": ["Strong leadership", "Technical expertise"],
            "competencyStrengths": {"Team Leadership": 75, "Drive & Commitment": 80},
            "improvementAreas": ["Public sector experience"],
            "experienceLevel": "mid",
            "publicSectorExperience": False,
        }

        with patch.object(
            ai_service._client.messages,
            "create",
            new_callable=AsyncMock,
            return_value=mock_anthropic_response(expected_result),
        ):
            result = await ai_service.analyze_cv(
                cv_text="Sample CV content with experience details...",
                job_spec_text="HEO position requirements...",
            )

        assert result["experienceLevel"] == "mid"
        assert "keyHighlights" in result
        assert "competencyStrengths" in result

    @pytest.mark.asyncio
    async def test_handles_json_with_markdown(
        self, ai_service: AnthropicAIService
    ) -> None:
        """Should clean markdown code blocks from response."""
        response = MagicMock()
        text_block = MagicMock()
        text_block.type = "text"
        text_block.text = '```json\n{"experienceLevel": "senior"}\n```'
        response.content = [text_block]

        with patch.object(
            ai_service._client.messages,
            "create",
            new_callable=AsyncMock,
            return_value=response,
        ):
            result = await ai_service.analyze_cv(cv_text="Senior CV content...")

        assert result["experienceLevel"] == "senior"

    @pytest.mark.asyncio
    async def test_raises_error_on_invalid_json(
        self, ai_service: AnthropicAIService
    ) -> None:
        """Should raise AIServiceError for invalid JSON response."""
        response = MagicMock()
        text_block = MagicMock()
        text_block.type = "text"
        text_block.text = "This is not valid JSON"
        response.content = [text_block]

        with patch.object(
            ai_service._client.messages,
            "create",
            new_callable=AsyncMock,
            return_value=response,
        ):
            with pytest.raises(AIServiceError, match="Failed to parse"):
                await ai_service.analyze_cv(cv_text="Sample CV")


class TestGenerateQuestions:
    """Tests for AnthropicAIService.generate_questions method."""

    @pytest.mark.asyncio
    async def test_generates_questions_successfully(
        self, ai_service: AnthropicAIService, mock_anthropic_response
    ) -> None:
        """Should return question set from API response."""
        cv_analysis = {
            "keyHighlights": ["Leadership"],
            "competencyStrengths": {"Team Leadership": 75},
            "experienceLevel": "mid",
        }

        expected_result = {
            "questions": [
                {
                    "id": "q1",
                    "competency": "Team Leadership",
                    "questionText": "Tell me about a time...",
                    "difficulty": "intermediate",
                    "focusAreas": ["team management"],
                }
            ],
            "totalQuestions": 12,
            "competencyDistribution": {"Team Leadership": 2},
        }

        with patch.object(
            ai_service._client.messages,
            "create",
            new_callable=AsyncMock,
            return_value=mock_anthropic_response(expected_result),
        ):
            result = await ai_service.generate_questions(
                cv_analysis=cv_analysis,
                grade="heo",
                framework="old",
            )

        assert "questions" in result
        assert result["totalQuestions"] == 12

    @pytest.mark.asyncio
    async def test_raises_error_for_invalid_grade(
        self, ai_service: AnthropicAIService
    ) -> None:
        """Should raise AIServiceError for invalid grade."""
        with pytest.raises(AIServiceError, match="Invalid grade"):
            await ai_service.generate_questions(
                cv_analysis={"keyHighlights": []},
                grade="invalid_grade",
            )


class TestEvaluateAnswer:
    """Tests for AnthropicAIService.evaluate_answer method."""

    @pytest.mark.asyncio
    async def test_evaluates_answer_successfully(
        self, ai_service: AnthropicAIService, mock_anthropic_response
    ) -> None:
        """Should return answer evaluation from API response."""
        expected_result = {
            "overallScore": 7.5,
            "competencyScores": {"Team Leadership": 8},
            "feedback": "Good answer with clear structure.",
            "strengths": ["Clear structure", "Good examples"],
            "improvementAreas": ["More metrics"],
            "improvedAnswer": "An improved version...",
            "starMethodAnalysis": {
                "situation": 8,
                "task": 7,
                "action": 8,
                "result": 7,
            },
        }

        with patch.object(
            ai_service._client.messages,
            "create",
            new_callable=AsyncMock,
            return_value=mock_anthropic_response(expected_result),
        ):
            result = await ai_service.evaluate_answer(
                question_text="Tell me about leadership...",
                answer_text="In my previous role, I led a team...",
                competency="Team Leadership",
            )

        assert result["overallScore"] == 7.5
        assert "starMethodAnalysis" in result
        assert "improvedAnswer" in result


class TestGenerateSampleAnswer:
    """Tests for AnthropicAIService.generate_sample_answer method."""

    @pytest.mark.asyncio
    async def test_generates_sample_answer_successfully(
        self, ai_service: AnthropicAIService, mock_anthropic_response
    ) -> None:
        """Should return sample answer from API response."""
        expected_result = {
            "sampleAnswer": "Situation: In my role as...",
            "explanation": "This answer demonstrates...",
            "score": 8.5,
        }

        with patch.object(
            ai_service._client.messages,
            "create",
            new_callable=AsyncMock,
            return_value=mock_anthropic_response(expected_result),
        ):
            result = await ai_service.generate_sample_answer(
                question_text="Tell me about leadership...",
                competency="Team Leadership",
                experience_level="mid",
            )

        assert "sampleAnswer" in result
        assert result["score"] == 8.5
