"""Dependency injection container using dependency-injector.

Provides centralized dependency management for the application with
providers for configuration, database, repositories, and services.
"""

from dependency_injector import containers, providers

from src.infrastructure.config import Settings
from src.infrastructure.database.session import DatabaseSession


class Container(containers.DeclarativeContainer):
    """Application dependency injection container.

    Provides:
    - Configuration from environment variables
    - Database engine and session factory
    - Repository instances (to be added)
    - Service instances (to be added)
    """

    # Wiring configuration - modules that will use @inject
    wiring_config = containers.WiringConfiguration(
        modules=[
            "src.api.main",
            "src.api.routes",
            "src.api.routes.auth",
        ],
        packages=[
            "src.api.routes",
        ],
    )

    # Configuration provider
    config = providers.Configuration()

    # Settings provider - loads from environment
    settings = providers.Singleton(Settings)

    # Database session manager
    db = providers.Singleton(
        DatabaseSession,
        database_url=config.database_url,
        pool_size=config.db_pool_size,
        max_overflow=config.db_max_overflow,
        echo=config.db_echo,
    )

    # Session factory provider (for FastAPI dependency injection)
    session_factory = providers.Factory(
        lambda db: db.session_factory,
        db=db,
    )


def create_container() -> Container:
    """Create and configure the DI container.

    Loads configuration from Settings and returns a configured container.

    Returns:
        Configured Container instance
    """
    container = Container()

    # Load settings
    settings = Settings()

    # Configure the container with settings values
    container.config.from_dict({
        "database_url": settings.database_url,
        "db_pool_size": settings.db_pool_size,
        "db_max_overflow": settings.db_max_overflow,
        "db_echo": settings.db_echo,
        "app_env": settings.app_env,
        "app_debug": settings.app_debug,
        "cors_origins": settings.cors_origins_list,
        "ai_provider": settings.ai_provider,
        "openai_api_key": settings.openai_api_key,
        "anthropic_api_key": settings.anthropic_api_key,
        "stripe_secret_key": settings.stripe_secret_key,
        "stripe_webhook_secret": settings.stripe_webhook_secret,
        "sendgrid_api_key": settings.sendgrid_api_key,
        "sendgrid_from_email": settings.sendgrid_from_email,
        "deepgram_api_key": settings.deepgram_api_key,
        "otel_enabled": settings.otel_enabled,
        "otel_service_name": settings.otel_service_name,
        "langfuse_enabled": settings.langfuse_enabled,
    })

    return container
