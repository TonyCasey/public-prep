"""Dependency injection module.

Provides the application DI container and related utilities.
"""

from .container import Container, create_container

__all__ = ["Container", "create_container"]
