"""Health check and readiness middleware.

Provides endpoints for Kubernetes/Railway health probes.
"""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import DbSession
from src.infrastructure.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


class HealthStatus(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Health status: healthy or unhealthy")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    environment: str = Field(..., description="Deployment environment")
    timestamp: str = Field(..., description="ISO timestamp")


class ReadinessStatus(BaseModel):
    """Readiness check response with component status."""

    ready: bool = Field(..., description="Overall readiness")
    checks: dict[str, bool] = Field(..., description="Individual component checks")
    timestamp: str = Field(..., description="ISO timestamp")


class LivenessStatus(BaseModel):
    """Liveness check response."""

    alive: bool = Field(..., description="Service is alive")
    timestamp: str = Field(..., description="ISO timestamp")


@router.get(
    "/health",
    response_model=HealthStatus,
    responses={
        200: {"description": "Service is healthy"},
        503: {"description": "Service is unhealthy"},
    },
)
async def health_check() -> HealthStatus:
    """Basic health check endpoint.

    Returns service status, version, and environment info.
    Used by load balancers and monitoring systems.
    """
    settings = get_settings()

    return HealthStatus(
        status="healthy",
        service="public-prep-python-api",
        version="0.1.0",
        environment=settings.app_env,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )


@router.get(
    "/ready",
    response_model=ReadinessStatus,
    responses={
        200: {"description": "Service is ready"},
        503: {"description": "Service is not ready"},
    },
)
async def readiness_check(db: DbSession) -> ReadinessStatus:
    """Readiness check with dependency verification.

    Verifies that all required dependencies (database, etc.)
    are available and the service can handle requests.
    """
    checks: dict[str, bool] = {}

    # Check database connectivity
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception as e:
        logger.error(f"Database readiness check failed: {e}")
        checks["database"] = False

    # Check configuration
    settings = get_settings()
    checks["config"] = True

    # Optional: Check external service connectivity
    checks["ai_service"] = bool(settings.anthropic_api_key)
    checks["email_service"] = bool(settings.sendgrid_api_key)
    checks["payment_service"] = bool(settings.stripe_secret_key)

    # Overall readiness requires core services
    ready = checks.get("database", False) and checks.get("config", False)

    return ReadinessStatus(
        ready=ready,
        checks=checks,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )


@router.get(
    "/live",
    response_model=LivenessStatus,
    responses={
        200: {"description": "Service is alive"},
    },
)
async def liveness_check() -> LivenessStatus:
    """Liveness check endpoint.

    Simple check that the service is running and can respond.
    Used by Kubernetes/Railway to detect stuck processes.
    """
    return LivenessStatus(
        alive=True,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )


@router.get("/metrics")
async def metrics() -> dict[str, Any]:
    """Basic metrics endpoint.

    Returns runtime statistics for monitoring.
    Consider using Prometheus client for production.
    """
    import sys

    settings = get_settings()

    return {
        "service": "public-prep-python-api",
        "version": "0.1.0",
        "environment": settings.app_env,
        "python_version": sys.version,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
