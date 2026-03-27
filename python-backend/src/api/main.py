"""FastAPI application entry point.

This is the main FastAPI application that will be deployed to Railway.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import (
    answers_router,
    auth_router,
    documents_router,
    interviews_router,
    questions_router,
    ratings_router,
    users_router,
)
from src.infrastructure.config import get_settings
from src.infrastructure.di.container import Container, create_container

# Global container instance
container: Container | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown events."""
    global container

    # Startup
    print("Starting Public Prep Python API...")

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
    print("Shutting down Public Prep Python API...")

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
        description="Interview preparation platform API",
        version="0.1.0",
        lifespan=lifespan,
        debug=settings.app_debug,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check endpoint
    @app.get("/api/health")
    async def health_check() -> dict[str, Any]:
        """Health check endpoint for Railway."""
        return {
            "status": "healthy",
            "service": "public-prep-python-api",
            "version": "0.1.0",
            "environment": settings.app_env,
        }

    # Root endpoint
    @app.get("/")
    async def root() -> dict[str, str]:
        """Root endpoint."""
        return {"message": "Public Prep Python API", "docs": "/docs"}

    # Include routers
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(interviews_router)
    app.include_router(documents_router)
    app.include_router(questions_router)
    app.include_router(answers_router)
    app.include_router(ratings_router)

    return app


# Create the app instance
app = create_app()
