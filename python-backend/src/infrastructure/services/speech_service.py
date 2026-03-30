"""Speech-to-text service implementations.

Provides audio transcription using Deepgram and OpenAI Whisper.
"""

import logging
from io import BytesIO

from src.application.interfaces.speech_service import (
    ISpeechService,
    SpeechServiceError,
    TranscriptionResult,
)

logger = logging.getLogger(__name__)


class DeepgramSpeechService(ISpeechService):
    """Deepgram speech-to-text service implementation."""

    def __init__(self, api_key: str | None) -> None:
        """Initialize Deepgram speech service.

        Args:
            api_key: Deepgram API key (can be None if not configured)
        """
        self._api_key = api_key
        self._client = None

        if api_key:
            try:
                from deepgram import DeepgramClient

                self._client = DeepgramClient(api_key)
            except ImportError:
                logger.warning("deepgram-sdk not installed, Deepgram service unavailable")

    @property
    def provider_name(self) -> str:
        """Get the name of the speech provider."""
        return "deepgram"

    @property
    def is_configured(self) -> bool:
        """Check if the service is properly configured."""
        return self._client is not None and self._api_key is not None

    async def transcribe(
        self,
        audio_data: bytes,
        mime_type: str,
        filename: str | None = None,
    ) -> TranscriptionResult:
        """Transcribe audio to text using Deepgram.

        Args:
            audio_data: Raw audio bytes
            mime_type: MIME type of the audio
            filename: Optional original filename

        Returns:
            TranscriptionResult with transcript or error
        """
        if not self.is_configured:
            return TranscriptionResult(
                transcript="",
                success=False,
                provider=self.provider_name,
                error="Deepgram API key not configured",
            )

        try:
            from deepgram import PrerecordedOptions

            logger.info(
                f"Transcribing audio with Deepgram: size={len(audio_data)}, mime={mime_type}"
            )

            # Configure transcription options
            options = PrerecordedOptions(
                punctuate=True,
                language="en",
            )

            # Transcribe the audio
            source = {"buffer": audio_data, "mimetype": mime_type}
            response = await self._client.listen.asyncrest.v("1").transcribe_file(
                source, options
            )

            # Extract transcript from response
            transcript = ""
            confidence = 0.0

            if response and response.results and response.results.channels:
                channel = response.results.channels[0]
                if channel.alternatives:
                    alternative = channel.alternatives[0]
                    transcript = alternative.transcript or ""
                    confidence = alternative.confidence or 0.0

            if not transcript.strip():
                return TranscriptionResult(
                    transcript="",
                    success=False,
                    provider=self.provider_name,
                    error="No speech detected in audio",
                )

            logger.info(f"Deepgram transcription successful: {transcript[:50]}...")

            return TranscriptionResult(
                transcript=transcript.strip(),
                success=True,
                confidence=confidence,
                provider=self.provider_name,
            )

        except Exception as e:
            logger.error(f"Deepgram transcription error: {e}")

            error_msg = str(e).lower()
            quota_exceeded = "quota" in error_msg or "insufficient" in error_msg

            return TranscriptionResult(
                transcript="",
                success=False,
                provider=self.provider_name,
                error=self._get_error_message(e),
            )

    def _get_error_message(self, error: Exception) -> str:
        """Get user-friendly error message."""
        error_msg = str(error).lower()

        if "quota" in error_msg or "insufficient" in error_msg:
            return "Deepgram quota exceeded. Voice recording temporarily unavailable."
        elif "unauthorized" in error_msg or "api key" in error_msg:
            return "Deepgram API key invalid or unauthorized."
        elif "file size" in error_msg:
            return "Audio file too large. Please keep recordings under 25MB."
        else:
            return "Failed to transcribe audio. Please try again."


class WhisperSpeechService(ISpeechService):
    """OpenAI Whisper speech-to-text service implementation."""

    def __init__(self, api_key: str | None) -> None:
        """Initialize Whisper speech service.

        Args:
            api_key: OpenAI API key (can be None if not configured)
        """
        self._api_key = api_key
        self._client = None

        if api_key:
            try:
                from openai import AsyncOpenAI

                self._client = AsyncOpenAI(api_key=api_key)
            except ImportError:
                logger.warning("openai not installed, Whisper service unavailable")

    @property
    def provider_name(self) -> str:
        """Get the name of the speech provider."""
        return "whisper"

    @property
    def is_configured(self) -> bool:
        """Check if the service is properly configured."""
        return self._client is not None and self._api_key is not None

    async def transcribe(
        self,
        audio_data: bytes,
        mime_type: str,
        filename: str | None = None,
    ) -> TranscriptionResult:
        """Transcribe audio to text using OpenAI Whisper.

        Args:
            audio_data: Raw audio bytes
            mime_type: MIME type of the audio
            filename: Optional original filename

        Returns:
            TranscriptionResult with transcript or error
        """
        if not self.is_configured:
            return TranscriptionResult(
                transcript="",
                success=False,
                provider=self.provider_name,
                error="OpenAI API key not configured",
            )

        try:
            logger.info(
                f"Transcribing audio with Whisper: size={len(audio_data)}, mime={mime_type}"
            )

            # Determine file extension from mime type
            ext_map = {
                "audio/webm": "webm",
                "audio/wav": "wav",
                "audio/mp3": "mp3",
                "audio/mpeg": "mp3",
                "audio/ogg": "ogg",
                "audio/flac": "flac",
                "audio/m4a": "m4a",
            }
            extension = ext_map.get(mime_type, "webm")
            file_name = filename or f"audio.{extension}"

            # Create file-like object for OpenAI API
            audio_file = (file_name, BytesIO(audio_data), mime_type)

            # Transcribe using Whisper
            transcription = await self._client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-1",
                language="en",
                response_format="json",
                temperature=0.2,
            )

            transcript = transcription.text.strip() if transcription.text else ""

            if not transcript:
                return TranscriptionResult(
                    transcript="",
                    success=False,
                    provider=self.provider_name,
                    error="No speech detected in audio",
                )

            logger.info(f"Whisper transcription successful: {transcript[:50]}...")

            return TranscriptionResult(
                transcript=transcript,
                success=True,
                provider=self.provider_name,
            )

        except Exception as e:
            logger.error(f"Whisper transcription error: {e}")

            return TranscriptionResult(
                transcript="",
                success=False,
                provider=self.provider_name,
                error=self._get_error_message(e),
            )

    def _get_error_message(self, error: Exception) -> str:
        """Get user-friendly error message."""
        error_msg = str(error).lower()

        if "quota" in error_msg or "insufficient_quota" in error_msg:
            return "OpenAI quota exceeded. Voice recording temporarily unavailable."
        elif "api key" in error_msg:
            return "Speech recognition service temporarily unavailable."
        elif "file size" in error_msg:
            return "Audio file too large. Please keep recordings under 25MB."
        else:
            return "Failed to transcribe audio. Please try again."


def get_speech_service(
    deepgram_api_key: str | None = None,
    openai_api_key: str | None = None,
    prefer_deepgram: bool = True,
) -> ISpeechService | None:
    """Get the best available speech service.

    Args:
        deepgram_api_key: Deepgram API key
        openai_api_key: OpenAI API key
        prefer_deepgram: Whether to prefer Deepgram over Whisper

    Returns:
        Configured speech service or None if none available
    """
    if prefer_deepgram and deepgram_api_key:
        service = DeepgramSpeechService(deepgram_api_key)
        if service.is_configured:
            return service

    if openai_api_key:
        service = WhisperSpeechService(openai_api_key)
        if service.is_configured:
            return service

    # Fallback to Deepgram if Whisper not available
    if deepgram_api_key:
        service = DeepgramSpeechService(deepgram_api_key)
        if service.is_configured:
            return service

    return None
