"""FastAPI application entry point.

This is the main FastAPI application that will be deployed to Railway.
"""

import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print("Starting Public Prep Python API...")
    yield
    # Shutdown
    print("Shutting down Public Prep Python API...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Public Prep API",
        description="Interview preparation platform API",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Configure CORS
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
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
        }

    # Root endpoint
    @app.get("/")
    async def root() -> dict[str, str]:
        """Root endpoint."""
        return {"message": "Public Prep Python API", "docs": "/docs"}

    return app


# Create the app instance
app = create_app()
