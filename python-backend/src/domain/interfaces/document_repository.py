"""Document repository interface.

Defines data access operations for Document entities.
"""

from abc import abstractmethod
from typing import Any
from uuid import UUID

from src.domain.entities import Document
from src.domain.value_objects import DocumentType

from .repository import IRepository


class IDocumentRepository(IRepository[Document, UUID]):
    """Repository interface for Document entities.

    Extends base repository with document-specific query methods.
    """

    @abstractmethod
    async def get_by_user(
        self,
        user_id: str,
        doc_type: DocumentType | None = None,
        limit: int | None = None,
    ) -> list[Document]:
        """Find all documents for a specific user.

        Args:
            user_id: User's unique identifier
            doc_type: Optional document type filter
            limit: Maximum number of documents to return

        Returns:
            List of user's documents
        """
        ...

    @abstractmethod
    async def get_latest_by_type(
        self,
        user_id: str,
        doc_type: DocumentType,
    ) -> Document | None:
        """Get the most recently uploaded document of a specific type.

        Args:
            user_id: User's unique identifier
            doc_type: Document type to find

        Returns:
            Latest document of that type if exists, None otherwise
        """
        ...

    @abstractmethod
    async def get_cv(self, user_id: str) -> Document | None:
        """Get user's latest CV document.

        Args:
            user_id: User's unique identifier

        Returns:
            Latest CV if exists, None otherwise
        """
        ...

    @abstractmethod
    async def get_job_spec(self, user_id: str) -> Document | None:
        """Get user's latest job specification document.

        Args:
            user_id: User's unique identifier

        Returns:
            Latest job spec if exists, None otherwise
        """
        ...

    @abstractmethod
    async def update_analysis(
        self,
        document_id: UUID,
        analysis: dict[str, Any],
    ) -> Document | None:
        """Update document analysis results.

        Args:
            document_id: Document's unique identifier
            analysis: AI analysis results

        Returns:
            Updated document if found, None otherwise
        """
        ...

    @abstractmethod
    async def delete_by_user(self, user_id: str) -> int:
        """Delete all documents for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            Number of documents deleted
        """
        ...
