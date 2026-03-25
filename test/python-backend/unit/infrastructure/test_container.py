"""Unit tests for dependency injection container.

Tests Container creation, configuration, and providers.
"""

import os
from unittest.mock import patch

import pytest

from src.infrastructure.di.container import Container, create_container


class TestContainer:
    """Tests for DI Container class."""

    def test_container_has_config_provider(self) -> None:
        """Should have a configuration provider."""
        # Act
        container = Container()

        # Assert
        assert hasattr(container, "config")

    def test_container_has_settings_provider(self) -> None:
        """Should have a settings provider."""
        # Act
        container = Container()

        # Assert
        assert hasattr(container, "settings")

    def test_container_has_db_provider(self) -> None:
        """Should have a database provider."""
        # Act
        container = Container()

        # Assert
        assert hasattr(container, "db")

    def test_container_has_wiring_config(self) -> None:
        """Should have wiring configuration for FastAPI modules."""
        # Assert
        assert Container.wiring_config is not None
        assert "src.api.main" in Container.wiring_config.modules


class TestCreateContainer:
    """Tests for create_container factory function."""

    def test_creates_container_instance(self) -> None:
        """Should create a Container instance."""
        # Arrange
        env_vars = {
            "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/test",
        }

        # Act
        with patch.dict(os.environ, env_vars, clear=False):
            container = create_container()

        # Assert - Container is a DeclarativeContainer that becomes DynamicContainer at runtime
        assert hasattr(container, "config")
        assert hasattr(container, "db")
        assert hasattr(container, "settings")

    def test_configures_database_url(self) -> None:
        """Should configure database URL from settings."""
        # Arrange
        env_vars = {
            "DATABASE_URL": "postgresql+asyncpg://user:pass@host:5432/mydb",
        }

        # Act
        with patch.dict(os.environ, env_vars, clear=False):
            container = create_container()

        # Assert
        assert container.config.database_url() == "postgresql+asyncpg://user:pass@host:5432/mydb"

    def test_configures_pool_settings(self) -> None:
        """Should configure database pool settings."""
        # Arrange
        env_vars = {
            "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/test",
            "DB_POOL_SIZE": "15",
            "DB_MAX_OVERFLOW": "25",
        }

        # Act
        with patch.dict(os.environ, env_vars, clear=False):
            container = create_container()

        # Assert
        assert container.config.db_pool_size() == 15
        assert container.config.db_max_overflow() == 25

    def test_configures_app_environment(self) -> None:
        """Should configure app environment."""
        # Arrange
        env_vars = {
            "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/test",
            "APP_ENV": "staging",
        }

        # Act
        with patch.dict(os.environ, env_vars, clear=False):
            container = create_container()

        # Assert
        assert container.config.app_env() == "staging"

    def test_configures_cors_origins_as_list(self) -> None:
        """Should configure CORS origins as a list."""
        # Arrange
        env_vars = {
            "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/test",
            "CORS_ORIGINS": "https://a.com,https://b.com",
        }

        # Act
        with patch.dict(os.environ, env_vars, clear=False):
            container = create_container()

        # Assert
        cors = container.config.cors_origins()
        assert isinstance(cors, list)
        assert "https://a.com" in cors
        assert "https://b.com" in cors
