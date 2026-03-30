"""Speech API routes.

Handles audio transcription using Deepgram or OpenAI Whisper.
"""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, Field

from src.api.middleware.auth import CurrentUser
from src.application.interfaces.speech_service import (
    ISpeechService,
    SpeechServiceError,
    TranscriptionResult,
)
from src.infrastructure.config import get_settings
from src.infrastructure.services.speech_service import get_speech_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/speech", tags=["speech"])

# Maximum file size: 25MB
MAX_FILE_SIZE = 25 * 1024 * 1024

# Supported audio MIME types
SUPPORTED_MIME_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/ogg",
    "audio/flac",
    "audio/m4a",
    "audio/mp4",
    "audio/x-m4a",
}


class TranscriptionResponse(BaseModel):
    """Transcription response DTO."""

    transcript: str = Field(..., description="Transcribed text")
    success: bool = Field(..., description="Whether transcription succeeded")
    confidence: float | None = Field(None, description="Confidence score (0-1)")
    provider: str = Field(..., description="Speech provider used")
    error: str | None = Field(None, description="Error message if failed")

    model_config = {"populate_by_name": True}


def get_configured_speech_service(request: Request) -> ISpeechService:
    """Get configured speech service.

    Args:
        request: FastAPI request

    Returns:
        Configured speech service

    Raises:
        HTTPException: If no speech service is available
    """
    settings = get_settings()

    service = get_speech_service(
        deepgram_api_key=settings.deepgram_api_key,
        openai_api_key=settings.openai_api_key,
        prefer_deepgram=True,
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Speech transcription service not configured. "
            "Please set DEEPGRAM_API_KEY or OPENAI_API_KEY.",
        )

    return service


@router.post(
    "/transcribe",
    response_model=TranscriptionResponse,
    responses={
        400: {"description": "Invalid audio file"},
        401: {"description": "Not authenticated"},
        413: {"description": "File too large"},
        503: {"description": "Speech service unavailable"},
    },
)
async def transcribe_audio(
    current_user: CurrentUser,
    file: UploadFile = File(..., description="Audio file to transcribe"),
    speech_service: ISpeechService = Depends(get_configured_speech_service),
) -> TranscriptionResponse:
    """Transcribe audio to text.

    Accepts audio files up to 25MB in formats: webm, wav, mp3, ogg, flac, m4a.
    Uses Deepgram by default, falls back to OpenAI Whisper if unavailable.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audio file uploaded",
        )

    # Validate content type
    content_type = file.content_type or "audio/webm"
    if content_type not in SUPPORTED_MIME_TYPES:
        logger.warning(
            f"Unsupported audio type: {content_type}, proceeding with transcription"
        )

    # Read audio data
    try:
        audio_data = await file.read()
    except Exception as e:
        logger.error(f"Failed to read audio file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read audio file",
        )

    # Validate file size
    if len(audio_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB.",
        )

    if len(audio_data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file is empty",
        )

    logger.info(
        f"Transcribing audio for user {current_user.id}: "
        f"size={len(audio_data)}, type={content_type}, provider={speech_service.provider_name}"
    )

    # Transcribe
    try:
        result = await speech_service.transcribe(
            audio_data=audio_data,
            mime_type=content_type,
            filename=file.filename,
        )

        return TranscriptionResponse(
            transcript=result.transcript,
            success=result.success,
            confidence=result.confidence,
            provider=result.provider,
            error=result.error,
        )

    except SpeechServiceError as e:
        logger.error(f"Speech service error: {e}")

        if e.quota_exceeded:
            return TranscriptionResponse(
                transcript="",
                success=False,
                provider=speech_service.provider_name,
                error="Speech service quota exceeded. Please try again later.",
            )

        return TranscriptionResponse(
            transcript="",
            success=False,
            provider=speech_service.provider_name,
            error=str(e),
        )

    except Exception as e:
        logger.error(f"Unexpected transcription error: {e}")
        return TranscriptionResponse(
            transcript="",
            success=False,
            provider=speech_service.provider_name,
            error="Failed to transcribe audio. Please try again.",
        )


@router.get(
    "/status",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def get_speech_status(
    current_user: CurrentUser,
) -> dict:
    """Get speech service availability status.

    Returns information about which speech services are configured.
    """
    settings = get_settings()

    service = get_speech_service(
        deepgram_api_key=settings.deepgram_api_key,
        openai_api_key=settings.openai_api_key,
        prefer_deepgram=True,
    )

    return {
        "available": service is not None,
        "provider": service.provider_name if service else None,
        "deepgramConfigured": bool(settings.deepgram_api_key),
        "whisperConfigured": bool(settings.openai_api_key),
    }
