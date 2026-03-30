"""Observability infrastructure package.

Exports OpenTelemetry and LangFuse integration utilities.
"""

from src.infrastructure.observability.langfuse import (
    create_trace,
    flush_langfuse,
    get_langfuse_client,
    init_langfuse,
    score_trace,
    shutdown_langfuse,
    trace_llm_call,
)
from src.infrastructure.observability.telemetry import (
    create_span,
    get_tracer,
    init_telemetry,
    setup_fastapi_instrumentation,
    setup_httpx_instrumentation,
    setup_sqlalchemy_instrumentation,
)

__all__ = [
    # OpenTelemetry
    "create_span",
    "get_tracer",
    "init_telemetry",
    "setup_fastapi_instrumentation",
    "setup_httpx_instrumentation",
    "setup_sqlalchemy_instrumentation",
    # LangFuse
    "create_trace",
    "flush_langfuse",
    "get_langfuse_client",
    "init_langfuse",
    "score_trace",
    "shutdown_langfuse",
    "trace_llm_call",
]
