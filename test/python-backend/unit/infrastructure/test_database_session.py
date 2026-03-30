"""Unit tests for database session utilities.

Tests URL conversion and session factory creation.
"""

import pytest

from src.infrastructure.database.session import create_database_url


class TestCreateDatabaseUrl:
    """Tests for create_database_url function."""

    def test_converts_postgres_to_asyncpg(self) -> None:
        """Should convert postgres:// to postgresql+asyncpg://."""
        # Arrange
        url = "postgres://user:pass@host:5432/db"

        # Act
        result = create_database_url(url)

        # Assert
        assert result == "postgresql+asyncpg://user:pass@host:5432/db"

    def test_converts_postgresql_to_asyncpg(self) -> None:
        """Should convert postgresql:// to postgresql+asyncpg://."""
        # Arrange
        url = "postgresql://user:pass@host:5432/db"

        # Act
        result = create_database_url(url)

        # Assert
        assert result == "postgresql+asyncpg://user:pass@host:5432/db"

    def test_preserves_asyncpg_url(self) -> None:
        """Should not modify already asyncpg URLs."""
        # Arrange
        url = "postgresql+asyncpg://user:pass@host:5432/db"

        # Act
        result = create_database_url(url)

        # Assert
        assert result == "postgresql+asyncpg://user:pass@host:5432/db"

    def test_handles_railway_internal_url(self) -> None:
        """Should handle Railway internal database URLs."""
        # Arrange
        url = "postgres://postgres:secret@postgres.railway.internal:5432/railway"

        # Act
        result = create_database_url(url)

        # Assert
        assert result == "postgresql+asyncpg://postgres:secret@postgres.railway.internal:5432/railway"

    def test_handles_url_with_options(self) -> None:
        """Should preserve URL query parameters."""
        # Arrange
        url = "postgres://user:pass@host:5432/db?sslmode=require"

        # Act
        result = create_database_url(url)

        # Assert
        assert result == "postgresql+asyncpg://user:pass@host:5432/db?sslmode=require"

    def test_handles_neon_url(self) -> None:
        """Should handle Neon database URLs."""
        # Arrange
        url = "postgresql://user:pass@ep-cool-name-123.us-east-2.aws.neon.tech/neondb"

        # Act
        result = create_database_url(url)

        # Assert
        assert result == "postgresql+asyncpg://user:pass@ep-cool-name-123.us-east-2.aws.neon.tech/neondb"
