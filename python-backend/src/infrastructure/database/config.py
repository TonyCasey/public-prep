"""Database configuration settings.

Loads database configuration from environment variables with sensible defaults.
"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class DatabaseConfig:
    """Database configuration settings.

    Attributes:
        url: PostgreSQL connection URL
        pool_size: Number of connections to keep in the pool
        max_overflow: Max connections that can be created beyond pool_size
        echo: Log all SQL statements (for debugging)
    """

    url: str
    pool_size: int = 5
    max_overflow: int = 10
    echo: bool = False

    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        """Create configuration from environment variables.

        Environment variables:
            DATABASE_URL: PostgreSQL connection URL (required)
            DB_POOL_SIZE: Connection pool size (default: 5)
            DB_MAX_OVERFLOW: Max overflow connections (default: 10)
            DB_ECHO: Log SQL statements (default: false)

        Returns:
            DatabaseConfig instance

        Raises:
            ValueError: If DATABASE_URL is not set
        """
        url = os.getenv("DATABASE_URL")
        if not url:
            raise ValueError("DATABASE_URL environment variable is required")

        return cls(
            url=url,
            pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
            echo=os.getenv("DB_ECHO", "false").lower() in ("true", "1", "yes"),
        )
