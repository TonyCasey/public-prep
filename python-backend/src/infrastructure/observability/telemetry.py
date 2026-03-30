"""OpenTelemetry instrumentation.

Provides distributed tracing for the application.
"""

import logging
from typing import Any

from src.infrastructure.config import get_settings

logger = logging.getLogger(__name__)

# Global tracer instance
_tracer = None


def init_telemetry() -> bool:
    """Initialize OpenTelemetry tracing.

    Returns:
        True if initialization succeeded
    """
    global _tracer
    settings = get_settings()

    if not settings.otel_enabled:
        logger.info("OpenTelemetry disabled")
        return False

    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
            OTLPSpanExporter,
        )
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor

        # Create resource with service info
        resource = Resource.create(
            {
                "service.name": settings.otel_service_name,
                "service.version": "0.1.0",
                "deployment.environment": settings.app_env,
            }
        )

        # Create tracer provider
        provider = TracerProvider(resource=resource)

        # Configure exporter if endpoint provided
        if settings.otel_exporter_otlp_endpoint:
            exporter = OTLPSpanExporter(
                endpoint=settings.otel_exporter_otlp_endpoint,
            )
            processor = BatchSpanProcessor(exporter)
            provider.add_span_processor(processor)

        # Set as global tracer provider
        trace.set_tracer_provider(provider)

        # Create tracer
        _tracer = trace.get_tracer(settings.otel_service_name)

        logger.info(
            f"OpenTelemetry initialized: service={settings.otel_service_name}, "
            f"endpoint={settings.otel_exporter_otlp_endpoint}"
        )
        return True

    except ImportError as e:
        logger.warning(f"OpenTelemetry packages not installed: {e}")
        return False
    except Exception as e:
        logger.error(f"Failed to initialize OpenTelemetry: {e}")
        return False


def get_tracer():
    """Get the global tracer instance.

    Returns:
        Tracer instance or None if not initialized
    """
    return _tracer


def setup_fastapi_instrumentation(app) -> bool:
    """Set up FastAPI instrumentation.

    Args:
        app: FastAPI application instance

    Returns:
        True if instrumentation was set up
    """
    settings = get_settings()

    if not settings.otel_enabled:
        return False

    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        FastAPIInstrumentor.instrument_app(app)
        logger.info("FastAPI instrumentation enabled")
        return True

    except ImportError:
        logger.warning("opentelemetry-instrumentation-fastapi not installed")
        return False
    except Exception as e:
        logger.error(f"Failed to instrument FastAPI: {e}")
        return False


def setup_sqlalchemy_instrumentation(engine) -> bool:
    """Set up SQLAlchemy instrumentation.

    Args:
        engine: SQLAlchemy engine instance

    Returns:
        True if instrumentation was set up
    """
    settings = get_settings()

    if not settings.otel_enabled:
        return False

    try:
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

        SQLAlchemyInstrumentor().instrument(engine=engine)
        logger.info("SQLAlchemy instrumentation enabled")
        return True

    except ImportError:
        logger.warning("opentelemetry-instrumentation-sqlalchemy not installed")
        return False
    except Exception as e:
        logger.error(f"Failed to instrument SQLAlchemy: {e}")
        return False


def setup_httpx_instrumentation() -> bool:
    """Set up HTTPX instrumentation for outgoing HTTP calls.

    Returns:
        True if instrumentation was set up
    """
    settings = get_settings()

    if not settings.otel_enabled:
        return False

    try:
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

        HTTPXClientInstrumentor().instrument()
        logger.info("HTTPX instrumentation enabled")
        return True

    except ImportError:
        logger.warning("opentelemetry-instrumentation-httpx not installed")
        return False
    except Exception as e:
        logger.error(f"Failed to instrument HTTPX: {e}")
        return False


def create_span(
    name: str,
    attributes: dict[str, Any] | None = None,
):
    """Create a new span context manager.

    Args:
        name: Span name
        attributes: Optional span attributes

    Returns:
        Span context manager or no-op if tracing disabled
    """
    if _tracer is None:
        from contextlib import nullcontext

        return nullcontext()

    span = _tracer.start_as_current_span(name)

    if attributes:
        span.set_attributes(attributes)

    return span
