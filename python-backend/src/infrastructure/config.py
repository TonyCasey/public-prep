"""Application configuration using pydantic-settings.

Loads configuration from environment variables with validation and defaults.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_env: str = Field(default="development", description="Environment: development, staging, production")
    app_debug: bool = Field(default=False, description="Enable debug mode")
    app_secret_key: str = Field(default="change-me-in-production", description="Secret key for sessions")

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/publicprep",
        description="PostgreSQL connection URL",
    )
    db_pool_size: int = Field(default=5, description="Database connection pool size")
    db_max_overflow: int = Field(default=10, description="Max overflow connections")
    db_echo: bool = Field(default=False, description="Log SQL queries")

    # CORS
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        description="Comma-separated list of allowed origins",
    )

    # AI Services
    ai_provider: str = Field(default="openai", description="AI provider: openai or anthropic")
    openai_api_key: str | None = Field(default=None, description="OpenAI API key")
    anthropic_api_key: str | None = Field(default=None, description="Anthropic API key")

    # Speech-to-Text
    deepgram_api_key: str | None = Field(default=None, description="Deepgram API key")

    # Payments
    stripe_secret_key: str | None = Field(default=None, description="Stripe secret key")
    stripe_webhook_secret: str | None = Field(default=None, description="Stripe webhook secret")
    stripe_price_id_starter: str | None = Field(default=None, description="Stripe price ID for starter plan")
    stripe_price_id_premium: str | None = Field(default=None, description="Stripe price ID for premium plan")
    stripe_price_id_upgrade: str | None = Field(default=None, description="Stripe price ID for upgrade to premium")

    # Application URLs
    app_base_url: str = Field(default="http://localhost:5173", description="Base URL for the application")

    # Email
    sendgrid_api_key: str | None = Field(default=None, description="SendGrid API key")
    sendgrid_from_email: str = Field(default="noreply@publicprep.ie", description="From email address")

    # Observability
    otel_enabled: bool = Field(default=False, description="Enable OpenTelemetry tracing")
    otel_service_name: str = Field(default="public-prep-api", description="Service name for tracing")
    otel_exporter_otlp_endpoint: str | None = Field(default=None, description="OTLP exporter endpoint")

    # LangFuse
    langfuse_enabled: bool = Field(default=False, description="Enable LangFuse LLM observability")
    langfuse_public_key: str | None = Field(default=None, description="LangFuse public key")
    langfuse_secret_key: str | None = Field(default=None, description="LangFuse secret key")
    langfuse_host: str = Field(default="https://cloud.langfuse.com", description="LangFuse host")

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development."""
        return self.app_env == "development"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance.

    Uses lru_cache to ensure settings are loaded once and reused.
    """
    return Settings()
