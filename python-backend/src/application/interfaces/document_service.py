"""Document service interface.

Defines the contract for document operations.
"""

from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID

from src.domain.entities import Document


class IDocumentService(ABC):
    """Interface for document service.

    Defines document management operations including file upload.
    """

    @abstractmethod
    async def get_user_documents(self, user_id: str) -> list[Document]:
        """Get all documents for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            List of user's documents
        """
        ...

    @abstractmethod
    async def get_document(
        self,
        document_id: UUID,
        requesting_user_id: str,
    ) -> Document:
        """Get a specific document.

        Args:
            document_id: Document's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            The requested document

        Raises:
            PermissionError: If user doesn't own the document
            ValueError: If document not found
        """
        ...

    @abstractmethod
    async def get_cv_analysis(self, user_id: str) -> dict[str, Any]:
        """Get CV analysis for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            CV analysis results

        Raises:
            ValueError: If no CV found or not analyzed
        """
        ...

    @abstractmethod
    async def upload_document(
        self,
        user_id: str,
        doc_type: str,
        filename: str,
        content: bytes,
    ) -> Document:
        """Upload and process a new document.

        Args:
            user_id: User's unique identifier
            doc_type: Document type (cv or job_spec)
            filename: Original filename
            content: File content as bytes

        Returns:
            The created document

        Raises:
            ValueError: If file validation or processing fails
        """
        ...

    @abstractmethod
    async def update_document(
        self,
        document_id: UUID,
        requesting_user_id: str,
        **updates,
    ) -> Document:
        """Update a document.

        Args:
            document_id: Document's unique identifier
            requesting_user_id: ID of the user making the request
            **updates: Fields to update

        Returns:
            The updated document

        Raises:
            PermissionError: If user doesn't own the document
            ValueError: If document not found
        """
        ...

    @abstractmethod
    async def delete_document(
        self,
        document_id: UUID,
        requesting_user_id: str,
    ) -> bool:
        """Delete a document.

        Args:
            document_id: Document's unique identifier
            requesting_user_id: ID of the user making the request

        Returns:
            True if deleted successfully

        Raises:
            PermissionError: If user doesn't own the document
            ValueError: If document not found
        """
        ...
