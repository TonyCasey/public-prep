"""LangFuse LLM observability integration.

Provides tracing and monitoring for LLM calls.
"""

import logging
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Generator

from src.infrastructure.config import get_settings

logger = logging.getLogger(__name__)

# Global LangFuse client
_langfuse_client = None


def init_langfuse() -> bool:
    """Initialize LangFuse client.

    Returns:
        True if initialization succeeded
    """
    global _langfuse_client
    settings = get_settings()

    if not settings.langfuse_enabled:
        logger.info("LangFuse disabled")
        return False

    if not settings.langfuse_public_key or not settings.langfuse_secret_key:
        logger.warning("LangFuse keys not configured")
        return False

    try:
        from langfuse import Langfuse

        _langfuse_client = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )

        logger.info(f"LangFuse initialized: host={settings.langfuse_host}")
        return True

    except ImportError:
        logger.warning("langfuse package not installed")
        return False
    except Exception as e:
        logger.error(f"Failed to initialize LangFuse: {e}")
        return False


def get_langfuse_client():
    """Get the global LangFuse client.

    Returns:
        LangFuse client or None if not initialized
    """
    return _langfuse_client


def flush_langfuse() -> None:
    """Flush pending LangFuse events."""
    if _langfuse_client:
        try:
            _langfuse_client.flush()
        except Exception as e:
            logger.error(f"Failed to flush LangFuse: {e}")


def shutdown_langfuse() -> None:
    """Shutdown LangFuse client."""
    global _langfuse_client
    if _langfuse_client:
        try:
            _langfuse_client.shutdown()
            _langfuse_client = None
        except Exception as e:
            logger.error(f"Failed to shutdown LangFuse: {e}")


@contextmanager
def trace_llm_call(
    name: str,
    model: str,
    user_id: str | None = None,
    session_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> Generator[dict[str, Any], None, None]:
    """Context manager for tracing LLM calls.

    Args:
        name: Name of the operation (e.g., "analyze_cv", "generate_questions")
        model: Model name (e.g., "claude-sonnet-4-20250514")
        user_id: Optional user ID for attribution
        session_id: Optional session ID for grouping
        metadata: Optional additional metadata

    Yields:
        Trace context dict with methods to record input/output

    Example:
        with trace_llm_call("analyze_cv", "claude-sonnet-4-20250514", user_id="123") as trace:
            trace["input"] = {"cv_text": "...", "prompt": "..."}
            result = await ai_service.analyze_cv(...)
            trace["output"] = result
            trace["usage"] = {"input_tokens": 100, "output_tokens": 200}
    """
    if not _langfuse_client:
        # Return no-op context
        yield {"input": None, "output": None, "usage": None, "error": None}
        return

    trace_context = {
        "input": None,
        "output": None,
        "usage": None,
        "error": None,
    }

    start_time = datetime.utcnow()
    trace = None

    try:
        # Create trace
        trace = _langfuse_client.trace(
            name=name,
            user_id=user_id,
            session_id=session_id,
            metadata=metadata or {},
        )

        yield trace_context

    except Exception as e:
        trace_context["error"] = str(e)
        raise

    finally:
        if trace:
            try:
                end_time = datetime.utcnow()

                # Create generation span
                generation = trace.generation(
                    name=f"{name}_generation",
                    model=model,
                    input=trace_context.get("input"),
                    output=trace_context.get("output"),
                    start_time=start_time,
                    end_time=end_time,
                    metadata={
                        "error": trace_context.get("error"),
                    },
                )

                # Record usage if provided
                usage = trace_context.get("usage")
                if usage:
                    generation.update(
                        usage={
                            "input": usage.get("input_tokens", 0),
                            "output": usage.get("output_tokens", 0),
                            "total": usage.get("total_tokens", 0),
                        }
                    )

            except Exception as e:
                logger.error(f"Failed to record LangFuse generation: {e}")


def create_trace(
    name: str,
    user_id: str | None = None,
    session_id: str | None = None,
    metadata: dict[str, Any] | None = None,
):
    """Create a new LangFuse trace.

    Args:
        name: Trace name
        user_id: Optional user ID
        session_id: Optional session ID
        metadata: Optional metadata

    Returns:
        LangFuse trace or None if not available
    """
    if not _langfuse_client:
        return None

    try:
        return _langfuse_client.trace(
            name=name,
            user_id=user_id,
            session_id=session_id,
            metadata=metadata or {},
        )
    except Exception as e:
        logger.error(f"Failed to create LangFuse trace: {e}")
        return None


def score_trace(
    trace_id: str,
    name: str,
    value: float,
    comment: str | None = None,
) -> bool:
    """Add a score to a trace.

    Args:
        trace_id: Trace ID to score
        name: Score name (e.g., "quality", "relevance")
        value: Score value (0-1)
        comment: Optional comment

    Returns:
        True if score was recorded
    """
    if not _langfuse_client:
        return False

    try:
        _langfuse_client.score(
            trace_id=trace_id,
            name=name,
            value=value,
            comment=comment,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to score LangFuse trace: {e}")
        return False
