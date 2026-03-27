"""Speech service interface.

Defines the contract for speech-to-text operations.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class TranscriptionResult:
    """Result of audio transcription.

    Attributes:
        transcript: The transcribed text
        success: Whether transcription succeeded
        confidence: Confidence score (0-1) if available
        provider: Name of the transcription provider
        error: Error message if failed
    """

    transcript: str
    success: bool
    confidence: float | None = None
    provider: str = "unknown"
    error: str | None = None


class ISpeechService(ABC):
    """Interface for speech-to-text operations."""

    @abstractmethod
    async def transcribe(
        self,
        audio_data: bytes,
        mime_type: str,
        filename: str | None = None,
    ) -> TranscriptionResult:
        """Transcribe audio to text.

        Args:
            audio_data: Raw audio bytes
            mime_type: MIME type of the audio (e.g., 'audio/webm')
            filename: Optional original filename

        Returns:
            TranscriptionResult with transcript or error
        """
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Get the name of the speech provider."""
        ...

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Check if the service is properly configured."""
        ...


class SpeechServiceError(Exception):
    """Exception raised when speech service operations fail."""

    def __init__(
        self,
        message: str,
        quota_exceeded: bool = False,
        original_error: Exception | None = None,
    ):
        super().__init__(message)
        self.quota_exceeded = quota_exceeded
        self.original_error = original_error
