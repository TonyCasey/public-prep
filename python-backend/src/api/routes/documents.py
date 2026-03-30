"""Document API routes.

Provides endpoints for document upload and management.
All endpoints require authentication.
"""

import logging
import re
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from src.api.dependencies import DbSession
from src.api.middleware.auth import CurrentUser
from src.application.dto.document import (
    DocumentAnalysisResponse,
    DocumentResponse,
    DocumentUpdateRequest,
    MessageResponse,
)
from src.application.services.document_service import DocumentService
from src.domain.entities import Document
from src.infrastructure.repositories.document_repository import DocumentRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])

# UUID validation regex
UUID_REGEX = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def get_document_service(db: DbSession) -> DocumentService:
    """Create document service with dependencies.

    Args:
        db: Database session from DI

    Returns:
        Configured DocumentService instance
    """
    doc_repo = DocumentRepository(db)
    return DocumentService(doc_repo)


DocumentServiceDep = Annotated[DocumentService, Depends(get_document_service)]


def _document_to_response(document: Document) -> DocumentResponse:
    """Convert Document entity to DocumentResponse DTO.

    Args:
        document: Document domain entity

    Returns:
        DocumentResponse DTO
    """
    return DocumentResponse(
        id=document.id,
        user_id=document.user_id,
        type=document.type.value,
        filename=document.filename,
        content=document.content,
        analysis=document.analysis,
        uploaded_at=document.uploaded_at,
    )


def _validate_uuid(document_id: str) -> UUID:
    """Validate and convert string to UUID.

    Args:
        document_id: String ID to validate

    Returns:
        UUID object

    Raises:
        HTTPException: If ID is not a valid UUID
    """
    if not UUID_REGEX.match(document_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Invalid document ID format - must be UUID"},
        )
    return UUID(document_id)


@router.get(
    "",
    response_model=list[DocumentResponse],
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def get_documents(
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
) -> list[DocumentResponse]:
    """Get all documents for the authenticated user."""
    documents = await document_service.get_user_documents(current_user.id)
    return [_document_to_response(d) for d in documents]


@router.get(
    "/analysis",
    response_model=DocumentAnalysisResponse,
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "No CV found or not analyzed"},
    },
)
async def get_cv_analysis(
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
) -> dict[str, Any]:
    """Get CV analysis results for the authenticated user."""
    try:
        analysis = await document_service.get_cv_analysis(current_user.id)
        return analysis

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    responses={
        400: {"description": "Invalid document ID"},
        401: {"description": "Not authenticated"},
        404: {"description": "Document not found"},
    },
)
async def get_document(
    document_id: str,
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
) -> DocumentResponse:
    """Get a specific document by ID."""
    doc_uuid = _validate_uuid(document_id)

    try:
        document = await document_service.get_document(doc_uuid, current_user.id)
        return _document_to_response(document)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"description": "Invalid file or document type"},
        401: {"description": "Not authenticated"},
    },
)
async def upload_document(
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
    file: UploadFile = File(..., description="Document file (PDF, DOC, DOCX, or TXT)"),
    type: str = Form(..., description="Document type: cv or job_spec"),
    filename: str | None = Form(None, description="Optional custom filename"),
) -> DocumentResponse:
    """Upload a new document.

    Supports PDF, DOC, DOCX, and TXT files up to 5MB.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "No file uploaded"},
        )

    # Read file content
    content = await file.read()

    # Use custom filename or original
    doc_filename = filename or file.filename

    try:
        document = await document_service.upload_document(
            user_id=current_user.id,
            doc_type=type,
            filename=doc_filename,
            content=content,
        )
        return _document_to_response(document)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(e)},
        )


@router.patch(
    "/{document_id}",
    response_model=DocumentResponse,
    responses={
        400: {"description": "Invalid document ID"},
        401: {"description": "Not authenticated"},
        404: {"description": "Document not found"},
    },
)
async def update_document(
    document_id: str,
    request: DocumentUpdateRequest,
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
) -> DocumentResponse:
    """Update a document.

    Only provided fields will be updated.
    """
    doc_uuid = _validate_uuid(document_id)

    try:
        updates = {}
        if request.filename is not None:
            updates["filename"] = request.filename
        if request.analysis is not None:
            updates["analysis"] = request.analysis

        document = await document_service.update_document(
            document_id=doc_uuid,
            requesting_user_id=current_user.id,
            **updates,
        )
        return _document_to_response(document)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )


@router.delete(
    "/{document_id}",
    response_model=MessageResponse,
    responses={
        400: {"description": "Invalid document ID"},
        401: {"description": "Not authenticated"},
        404: {"description": "Document not found"},
        500: {"description": "Failed to delete"},
    },
)
async def delete_document(
    document_id: str,
    current_user: CurrentUser,
    document_service: DocumentServiceDep,
) -> MessageResponse:
    """Delete a document."""
    doc_uuid = _validate_uuid(document_id)

    try:
        deleted = await document_service.delete_document(doc_uuid, current_user.id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"message": "Failed to delete document"},
            )

        return MessageResponse(message="Document deleted successfully")

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": str(e)},
        )
