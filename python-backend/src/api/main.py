"""FastAPI application entry point.

This is the main FastAPI application that will be deployed to Railway.
"""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.middleware.health import router as health_router
from src.api.routes import (
    ai_router,
    answers_router,
    auth_router,
    documents_router,
    interviews_router,
    questions_router,
    ratings_router,
    speech_router,
    stripe_router,
    users_router,
)
from src.infrastructure.config import get_settings
from src.infrastructure.di.container import Container, create_container
from src.infrastructure.observability import (
    flush_langfuse,
    init_langfuse,
    init_telemetry,
    setup_fastapi_instrumentation,
    shutdown_langfuse,
)

logger = logging.getLogger(__name__)

# Global container instance
container: Container | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown events."""
    global container

    # Startup
    logger.info("Starting Public Prep Python API...")

    # Initialize observability
    init_telemetry()
    init_langfuse()

    # Initialize DI container
    container = create_container()

    # Wire the container to modules
    container.wire(
        modules=[__name__],
        packages=["src.api.routes"],
    )

    # Store container in app state for access in routes
    app.state.container = container

    yield

    # Shutdown
    logger.info("Shutting down Public Prep Python API...")

    # Flush observability data
    flush_langfuse()
    shutdown_langfuse()

    # Close database connections
    if container:
        db = container.db()
        await db.close()

    # Unwire container
    if container:
        container.unwire()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Public Prep API",
        description="AI-powered interview preparation platform for Irish Public Service roles",
        version="0.1.0",
        lifespan=lifespan,
        debug=settings.app_debug,
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Setup OpenTelemetry instrumentation
    if settings.otel_enabled:
        setup_fastapi_instrumentation(app)

    # Root endpoint
    @app.get("/")
    async def root() -> dict[str, str]:
        """Root endpoint."""
        return {
            "message": "Public Prep Python API",
            "version": "0.1.0",
            "docs": "/docs" if settings.is_development else "disabled",
        }

    # Include health check routes
    app.include_router(health_router, prefix="/api")

    # Include API routers
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(interviews_router)
    app.include_router(documents_router)
    app.include_router(questions_router)
    app.include_router(answers_router)
    app.include_router(ratings_router)
    app.include_router(ai_router)
    app.include_router(speech_router)
    app.include_router(stripe_router)

    return app


# Create the app instance
app = create_app()
