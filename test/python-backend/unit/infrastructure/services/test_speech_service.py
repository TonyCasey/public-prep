"""Unit tests for speech services.

Tests DeepgramSpeechService and WhisperSpeechService with mocked clients.
"""

import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.application.interfaces.speech_service import TranscriptionResult


class TestDeepgramSpeechService:
    """Tests for DeepgramSpeechService."""

    def _create_mock_deepgram_module(self) -> MagicMock:
        """Create mock deepgram module."""
        mock_deepgram = MagicMock()
        mock_deepgram.DeepgramClient = MagicMock()
        mock_deepgram.PrerecordedOptions = MagicMock()
        return mock_deepgram

    def test_is_configured_with_api_key(self) -> None:
        """Should be configured when API key provided."""
        mock_deepgram = self._create_mock_deepgram_module()

        with patch.dict(sys.modules, {"deepgram": mock_deepgram}):
            from src.infrastructure.services.speech_service import DeepgramSpeechService

            service = DeepgramSpeechService(api_key="test-api-key")
            assert service.is_configured is True
            assert service.provider_name == "deepgram"

    def test_not_configured_without_api_key(self) -> None:
        """Should not be configured when API key is None."""
        from src.infrastructure.services.speech_service import DeepgramSpeechService

        service = DeepgramSpeechService(api_key=None)
        assert service.is_configured is False

    @pytest.mark.asyncio
    async def test_transcribe_returns_error_when_not_configured(self) -> None:
        """Should return error result when not configured."""
        from src.infrastructure.services.speech_service import DeepgramSpeechService

        service = DeepgramSpeechService(api_key=None)

        result = await service.transcribe(
            audio_data=b"test audio data",
            mime_type="audio/webm",
        )

        assert result.success is False
        assert result.transcript == ""
        assert "not configured" in result.error.lower()

    @pytest.mark.asyncio
    async def test_transcribe_successfully(self) -> None:
        """Should return transcript when transcription succeeds."""
        mock_deepgram = self._create_mock_deepgram_module()
        mock_client = MagicMock()
        mock_deepgram.DeepgramClient.return_value = mock_client

        # Set up mock response
        mock_response = MagicMock()
        mock_response.results.channels = [
            MagicMock(
                alternatives=[MagicMock(transcript="Hello world", confidence=0.95)]
            )
        ]

        mock_client.listen.asyncrest.v.return_value.transcribe_file = AsyncMock(
            return_value=mock_response
        )

        with patch.dict(sys.modules, {"deepgram": mock_deepgram}):
            from src.infrastructure.services.speech_service import DeepgramSpeechService

            service = DeepgramSpeechService(api_key="test-api-key")

            result = await service.transcribe(
                audio_data=b"test audio data",
                mime_type="audio/webm",
            )

            assert result.success is True
            assert result.transcript == "Hello world"
            assert result.confidence == 0.95
            assert result.provider == "deepgram"

    @pytest.mark.asyncio
    async def test_transcribe_returns_error_when_no_speech_detected(self) -> None:
        """Should return error when no speech detected."""
        mock_deepgram = self._create_mock_deepgram_module()
        mock_client = MagicMock()
        mock_deepgram.DeepgramClient.return_value = mock_client

        mock_response = MagicMock()
        mock_response.results.channels = [
            MagicMock(alternatives=[MagicMock(transcript="", confidence=0.0)])
        ]

        mock_client.listen.asyncrest.v.return_value.transcribe_file = AsyncMock(
            return_value=mock_response
        )

        with patch.dict(sys.modules, {"deepgram": mock_deepgram}):
            from src.infrastructure.services.speech_service import DeepgramSpeechService

            service = DeepgramSpeechService(api_key="test-api-key")

            result = await service.transcribe(
                audio_data=b"test audio data",
                mime_type="audio/webm",
            )

            assert result.success is False
            assert result.transcript == ""
            assert "no speech" in result.error.lower()

    @pytest.mark.asyncio
    async def test_transcribe_handles_quota_error(self) -> None:
        """Should return quota exceeded error message."""
        mock_deepgram = self._create_mock_deepgram_module()
        mock_client = MagicMock()
        mock_deepgram.DeepgramClient.return_value = mock_client

        mock_client.listen.asyncrest.v.return_value.transcribe_file = AsyncMock(
            side_effect=Exception("quota exceeded")
        )

        with patch.dict(sys.modules, {"deepgram": mock_deepgram}):
            from src.infrastructure.services.speech_service import DeepgramSpeechService

            service = DeepgramSpeechService(api_key="test-api-key")

            result = await service.transcribe(
                audio_data=b"test audio data",
                mime_type="audio/webm",
            )

            assert result.success is False
            assert "quota" in result.error.lower()


class TestWhisperSpeechService:
    """Tests for WhisperSpeechService."""

    def _create_mock_openai_module(self) -> MagicMock:
        """Create mock openai module."""
        mock_openai = MagicMock()
        mock_openai.AsyncOpenAI = MagicMock()
        return mock_openai

    def test_is_configured_with_api_key(self) -> None:
        """Should be configured when API key provided."""
        mock_openai = self._create_mock_openai_module()

        with patch.dict(sys.modules, {"openai": mock_openai}):
            from src.infrastructure.services.speech_service import WhisperSpeechService

            service = WhisperSpeechService(api_key="test-api-key")
            assert service.is_configured is True
            assert service.provider_name == "whisper"

    def test_not_configured_without_api_key(self) -> None:
        """Should not be configured when API key is None."""
        from src.infrastructure.services.speech_service import WhisperSpeechService

        service = WhisperSpeechService(api_key=None)
        assert service.is_configured is False

    @pytest.mark.asyncio
    async def test_transcribe_returns_error_when_not_configured(self) -> None:
        """Should return error result when not configured."""
        from src.infrastructure.services.speech_service import WhisperSpeechService

        service = WhisperSpeechService(api_key=None)

        result = await service.transcribe(
            audio_data=b"test audio data",
            mime_type="audio/webm",
        )

        assert result.success is False
        assert result.transcript == ""
        assert "not configured" in result.error.lower()

    @pytest.mark.asyncio
    async def test_transcribe_successfully(self) -> None:
        """Should return transcript when transcription succeeds."""
        mock_openai = self._create_mock_openai_module()
        mock_client = MagicMock()
        mock_openai.AsyncOpenAI.return_value = mock_client

        mock_transcription = MagicMock()
        mock_transcription.text = "Hello from Whisper"

        mock_client.audio.transcriptions.create = AsyncMock(
            return_value=mock_transcription
        )

        with patch.dict(sys.modules, {"openai": mock_openai}):
            from src.infrastructure.services.speech_service import WhisperSpeechService

            service = WhisperSpeechService(api_key="test-api-key")

            result = await service.transcribe(
                audio_data=b"test audio data",
                mime_type="audio/webm",
            )

            assert result.success is True
            assert result.transcript == "Hello from Whisper"
            assert result.provider == "whisper"

    @pytest.mark.asyncio
    async def test_transcribe_returns_error_when_no_speech_detected(self) -> None:
        """Should return error when no speech detected."""
        mock_openai = self._create_mock_openai_module()
        mock_client = MagicMock()
        mock_openai.AsyncOpenAI.return_value = mock_client

        mock_transcription = MagicMock()
        mock_transcription.text = ""

        mock_client.audio.transcriptions.create = AsyncMock(
            return_value=mock_transcription
        )

        with patch.dict(sys.modules, {"openai": mock_openai}):
            from src.infrastructure.services.speech_service import WhisperSpeechService

            service = WhisperSpeechService(api_key="test-api-key")

            result = await service.transcribe(
                audio_data=b"test audio data",
                mime_type="audio/webm",
            )

            assert result.success is False
            assert result.transcript == ""
            assert "no speech" in result.error.lower()

    @pytest.mark.asyncio
    async def test_transcribe_handles_quota_error(self) -> None:
        """Should return quota exceeded error message."""
        mock_openai = self._create_mock_openai_module()
        mock_client = MagicMock()
        mock_openai.AsyncOpenAI.return_value = mock_client

        mock_client.audio.transcriptions.create = AsyncMock(
            side_effect=Exception("insufficient_quota")
        )

        with patch.dict(sys.modules, {"openai": mock_openai}):
            from src.infrastructure.services.speech_service import WhisperSpeechService

            service = WhisperSpeechService(api_key="test-api-key")

            result = await service.transcribe(
                audio_data=b"test audio data",
                mime_type="audio/webm",
            )

            assert result.success is False
            assert "quota" in result.error.lower()

    @pytest.mark.asyncio
    async def test_transcribe_uses_correct_mime_type_extension(self) -> None:
        """Should map MIME type to correct file extension."""
        mock_openai = self._create_mock_openai_module()
        mock_client = MagicMock()
        mock_openai.AsyncOpenAI.return_value = mock_client

        mock_transcription = MagicMock()
        mock_transcription.text = "Test"

        mock_client.audio.transcriptions.create = AsyncMock(
            return_value=mock_transcription
        )

        with patch.dict(sys.modules, {"openai": mock_openai}):
            from src.infrastructure.services.speech_service import WhisperSpeechService

            service = WhisperSpeechService(api_key="test-api-key")

            # Test different MIME types
            for mime_type, expected_ext in [
                ("audio/mp3", "mp3"),
                ("audio/wav", "wav"),
                ("audio/ogg", "ogg"),
            ]:
                await service.transcribe(
                    audio_data=b"test audio data",
                    mime_type=mime_type,
                )

                # Verify the file tuple was created with correct extension
                call_args = mock_client.audio.transcriptions.create.call_args
                file_tuple = call_args.kwargs["file"]
                assert expected_ext in file_tuple[0]


class TestGetSpeechService:
    """Tests for get_speech_service factory function."""

    def _create_mock_deepgram_module(self) -> MagicMock:
        """Create mock deepgram module."""
        mock_deepgram = MagicMock()
        mock_deepgram.DeepgramClient = MagicMock()
        mock_deepgram.PrerecordedOptions = MagicMock()
        return mock_deepgram

    def _create_mock_openai_module(self) -> MagicMock:
        """Create mock openai module."""
        mock_openai = MagicMock()
        mock_openai.AsyncOpenAI = MagicMock()
        return mock_openai

    def test_returns_deepgram_when_preferred_and_configured(self) -> None:
        """Should return Deepgram service when preferred and configured."""
        mock_deepgram = self._create_mock_deepgram_module()

        with patch.dict(sys.modules, {"deepgram": mock_deepgram}):
            from src.infrastructure.services.speech_service import get_speech_service

            service = get_speech_service(
                deepgram_api_key="deepgram-key",
                openai_api_key="openai-key",
                prefer_deepgram=True,
            )

            assert service is not None
            assert service.provider_name == "deepgram"

    def test_returns_whisper_when_deepgram_not_available(self) -> None:
        """Should return Whisper when Deepgram not available."""
        mock_openai = self._create_mock_openai_module()

        with patch.dict(sys.modules, {"openai": mock_openai}):
            from src.infrastructure.services.speech_service import get_speech_service

            service = get_speech_service(
                deepgram_api_key=None,
                openai_api_key="openai-key",
                prefer_deepgram=True,
            )

            assert service is not None
            assert service.provider_name == "whisper"

    def test_returns_whisper_when_preferred(self) -> None:
        """Should return Whisper when not preferring Deepgram."""
        mock_openai = self._create_mock_openai_module()

        with patch.dict(sys.modules, {"openai": mock_openai}):
            from src.infrastructure.services.speech_service import get_speech_service

            service = get_speech_service(
                deepgram_api_key="deepgram-key",
                openai_api_key="openai-key",
                prefer_deepgram=False,
            )

            assert service is not None
            assert service.provider_name == "whisper"

    def test_returns_none_when_no_service_configured(self) -> None:
        """Should return None when no service is configured."""
        from src.infrastructure.services.speech_service import get_speech_service

        service = get_speech_service(
            deepgram_api_key=None,
            openai_api_key=None,
            prefer_deepgram=True,
        )

        assert service is None

    def test_fallback_to_deepgram_when_whisper_not_configured(self) -> None:
        """Should fallback to Deepgram when Whisper not available."""
        mock_deepgram = self._create_mock_deepgram_module()

        with patch.dict(sys.modules, {"deepgram": mock_deepgram}):
            from src.infrastructure.services.speech_service import get_speech_service

            service = get_speech_service(
                deepgram_api_key="deepgram-key",
                openai_api_key=None,
                prefer_deepgram=False,  # Prefer Whisper but not available
            )

            assert service is not None
            assert service.provider_name == "deepgram"
