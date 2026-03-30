"""Unit tests for application configuration.

Tests Settings class validation, defaults, and property methods.
"""

import os
from unittest.mock import patch

import pytest

from src.infrastructure.config import Settings, get_settings


class TestSettings:
    """Tests for Settings configuration class."""

    def test_default_values_when_env_not_set(self) -> None:
        """Should use default values when environment variables are not set."""
        # Arrange - clear relevant env vars
        env_overrides = {
            "APP_ENV": "development",
            "APP_DEBUG": "false",
            "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/test",
        }

        # Act
        with patch.dict(os.environ, env_overrides, clear=False):
            settings = Settings()

        # Assert
        assert settings.app_env == "development"
        assert settings.app_debug is False
        assert settings.db_pool_size == 5
        assert settings.db_max_overflow == 10
        assert settings.ai_provider == "openai"

    def test_loads_from_environment_variables(self) -> None:
        """Should load values from environment variables."""
        # Arrange
        env_vars = {
            "APP_ENV": "production",
            "APP_DEBUG": "true",
            "DATABASE_URL": "postgresql+asyncpg://user:pass@host:5432/db",
            "DB_POOL_SIZE": "10",
            "DB_MAX_OVERFLOW": "20",
            "AI_PROVIDER": "anthropic",
            "CORS_ORIGINS": "https://example.com,https://api.example.com",
        }

        # Act
        with patch.dict(os.environ, env_vars, clear=False):
            settings = Settings()

        # Assert
        assert settings.app_env == "production"
        assert settings.app_debug is True
        assert settings.database_url == "postgresql+asyncpg://user:pass@host:5432/db"
        assert settings.db_pool_size == 10
        assert settings.db_max_overflow == 20
        assert settings.ai_provider == "anthropic"

    def test_cors_origins_list_parses_comma_separated_string(self) -> None:
        """Should parse CORS origins from comma-separated string."""
        # Arrange
        env_vars = {
            "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/test",
            "CORS_ORIGINS": "https://a.com, https://b.com , https://c.com",
        }

        # Act
        with patch.dict(os.environ, env_vars, clear=False):
            settings = Settings()

        # Assert
        assert settings.cors_origins_list == [
            "https://a.com",
            "https://b.com",
            "https://c.com",
        ]

    def test_cors_origins_list_handles_empty_entries(self) -> None:
        """Should filter out empty entries from CORS origins."""
        # Arrange
        env_vars = {
            "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/test",
            "CORS_ORIGINS": "https://a.com,,https://b.com,",
        }

        # Act
        with patch.dict(os.environ, env_vars, clear=False):
            settings = Settings()

        # Assert
        assert settings.cors_origins_list == ["https://a.com", "https://b.com"]

    def test_is_production_returns_true_when_production(self) -> None:
        """Should return True when app_env is production."""
        # Arrange
        env_vars = {
            "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/test",
            "APP_ENV": "production",
        }

        # Act
        with patch.dict(os.environ, env_vars, clear=False):
            settings = Settings()

        # Assert
        assert settings.is_production is True
        assert settings.is_development is False

    def test_is_development_returns_true_when_development(self) -> None:
        """Should return True when app_env is development."""
        # Arrange
        env_vars = {
            "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/test",
            "APP_ENV": "development",
        }

        # Act
        with patch.dict(os.environ, env_vars, clear=False):
            settings = Settings()

        # Assert
        assert settings.is_development is True
        assert settings.is_production is False


class TestGetSettings:
    """Tests for get_settings cached function."""

    def test_returns_settings_instance(self) -> None:
        """Should return a Settings instance."""
        # Act
        get_settings.cache_clear()  # Clear cache for test isolation
        settings = get_settings()

        # Assert
        assert isinstance(settings, Settings)

    def test_returns_cached_instance(self) -> None:
        """Should return the same cached instance on subsequent calls."""
        # Arrange
        get_settings.cache_clear()

        # Act
        settings1 = get_settings()
        settings2 = get_settings()

        # Assert
        assert settings1 is settings2
