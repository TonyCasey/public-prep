"""Document service implementation.

Handles document upload, processing, and management.
"""

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from src.application.interfaces.document_service import IDocumentService
from src.domain.entities import Document
from src.domain.interfaces import IDocumentRepository
from src.domain.value_objects import DocumentType
from src.infrastructure.services.file_service import (
    extract_text_from_file,
    validate_file_size,
    validate_file_type,
)

logger = logging.getLogger(__name__)


class DocumentService(IDocumentService):
    """Document service implementation.

    Provides document management with file processing.
    """

    def __init__(self, document_repository: IDocumentRepository) -> None:
        """Initialize document service.

        Args:
            document_repository: Document repository for data access
        """
        self._doc_repo = document_repository

    async def _check_ownership(
        self,
        document: Document,
        requesting_user_id: str,
    ) -> None:
        """Check if user owns the document.

        Args:
            document: The document to check
            requesting_user_id: ID of the requesting user

        Raises:
            PermissionError: If user doesn't own the document
        """
        if document.user_id != requesting_user_id:
            logger.warning(
                f"Access denied: user {requesting_user_id} tried to access document {document.id}"
            )
            raise PermissionError("Access denied")

    async def _find_document_by_id(
        self,
        user_id: str,
        document_id: UUID,
    ) -> Document | None:
        """Find a document by ID, verifying user ownership.

        Args:
            user_id: User's ID
            document_id: Document's ID

        Returns:
            Document if found and owned by user, None otherwise
        """
        documents = await self._doc_repo.get_by_user(user_id)
        for doc in documents:
            if doc.id == document_id:
                return doc
        return None

    async def get_user_documents(self, user_id: str) -> list[Document]:
        """Get all documents for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            List of user's documents
        """
        return await self._doc_repo.get_by_user(user_id)

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
        document = await self._find_document_by_id(requesting_user_id, document_id)
        if document is None:
            raise ValueError("Document not found")

        return document

    async def get_cv_analysis(self, user_id: str) -> dict[str, Any]:
        """Get CV analysis for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            CV analysis results

        Raises:
            ValueError: If no CV found or not analyzed
        """
        cv = await self._doc_repo.get_cv(user_id)

        if cv is None:
            raise ValueError("No CV document found")

        if cv.analysis is None:
            raise ValueError("CV not analyzed yet")

        return cv.analysis

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
        # Validate document type
        if doc_type not in ["cv", "job_spec"]:
            raise ValueError("Invalid document type. Must be 'cv' or 'job_spec'")

        # Validate file type
        if not validate_file_type(filename):
            raise ValueError(
                "Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files."
            )

        # Validate file size
        if not validate_file_size(content):
            raise ValueError("File size exceeds 5MB limit")

        logger.info(f"Processing document upload: {filename} ({len(content)} bytes)")

        # Extract text content
        try:
            text_content = await extract_text_from_file(content, filename)
        except Exception as e:
            logger.error(f"Text extraction failed for {filename}: {e}")
            raise ValueError(f"Failed to extract text from file: {e}")

        logger.info(f"Extracted {len(text_content)} characters from {filename}")

        # Create document entity
        document = Document(
            id=uuid4(),
            user_id=user_id,
            type=DocumentType(doc_type),
            filename=filename,
            content=text_content,
            analysis=None,
            uploaded_at=datetime.now(UTC),
        )

        created = await self._doc_repo.create(document)
        logger.info(f"Created document {created.id} for user {user_id}")

        return created

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
        document = await self._find_document_by_id(requesting_user_id, document_id)
        if document is None:
            raise ValueError("Document not found")

        # Apply updates
        if "filename" in updates and updates["filename"] is not None:
            document.filename = updates["filename"]
        if "analysis" in updates and updates["analysis"] is not None:
            document.analysis = updates["analysis"]

        updated = await self._doc_repo.update(document)
        logger.info(f"Updated document {document_id}")

        return updated

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
        document = await self._find_document_by_id(requesting_user_id, document_id)
        if document is None:
            raise ValueError("Document not found")

        result = await self._doc_repo.delete(document_id)
        if result:
            logger.info(f"Deleted document {document_id}")

        return result
