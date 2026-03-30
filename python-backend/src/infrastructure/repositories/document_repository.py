"""SQLAlchemy Document repository implementation.

Implements IDocumentRepository interface using SQLAlchemy async operations.
"""

from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities import Document
from src.domain.interfaces import IDocumentRepository
from src.domain.value_objects import DocumentType
from src.infrastructure.database.models import Document as DocumentModel

from .base import SQLAlchemyRepository


class DocumentRepository(
    SQLAlchemyRepository[Document, DocumentModel, UUID], IDocumentRepository
):
    """SQLAlchemy implementation of IDocumentRepository.

    Provides document-specific data access operations.
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize document repository.

        Args:
            session: SQLAlchemy async session
        """
        super().__init__(session, DocumentModel)

    def _to_entity(self, model: DocumentModel) -> Document:
        """Convert DocumentModel to Document entity.

        Args:
            model: SQLAlchemy DocumentModel instance

        Returns:
            Document domain entity
        """
        return Document(
            id=model.id,
            user_id=model.user_id,
            type=DocumentType(model.type),
            filename=model.filename,
            content=model.content,
            analysis=model.analysis,
            uploaded_at=model.uploaded_at,
        )

    def _to_model(self, entity: Document) -> DocumentModel:
        """Convert Document entity to DocumentModel.

        Args:
            entity: Document domain entity

        Returns:
            SQLAlchemy DocumentModel instance
        """
        return DocumentModel(
            id=entity.id,
            user_id=entity.user_id,
            type=entity.type.value,
            filename=entity.filename,
            content=entity.content,
            analysis=entity.analysis,
            uploaded_at=entity.uploaded_at,
        )

    def _update_model(self, model: DocumentModel, entity: Document) -> DocumentModel:
        """Update existing DocumentModel with entity data.

        Args:
            model: Existing SQLAlchemy DocumentModel
            entity: Document entity with updated data

        Returns:
            Updated DocumentModel
        """
        model.user_id = entity.user_id
        model.type = entity.type.value
        model.filename = entity.filename
        model.content = entity.content
        model.analysis = entity.analysis
        model.uploaded_at = entity.uploaded_at
        return model

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
        stmt = select(DocumentModel).where(DocumentModel.user_id == user_id)

        if doc_type is not None:
            stmt = stmt.where(DocumentModel.type == doc_type.value)

        stmt = stmt.order_by(DocumentModel.uploaded_at.desc())

        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self._session.execute(stmt)
        models = result.scalars().all()

        return [self._to_entity(model) for model in models]

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
        stmt = (
            select(DocumentModel)
            .where(DocumentModel.user_id == user_id)
            .where(DocumentModel.type == doc_type.value)
            .order_by(DocumentModel.uploaded_at.desc())
            .limit(1)
        )

        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._to_entity(model)

    async def get_cv(self, user_id: str) -> Document | None:
        """Get user's latest CV document.

        Args:
            user_id: User's unique identifier

        Returns:
            Latest CV if exists, None otherwise
        """
        return await self.get_latest_by_type(user_id, DocumentType.CV)

    async def get_job_spec(self, user_id: str) -> Document | None:
        """Get user's latest job specification document.

        Args:
            user_id: User's unique identifier

        Returns:
            Latest job spec if exists, None otherwise
        """
        return await self.get_latest_by_type(user_id, DocumentType.JOB_SPEC)

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
        model = await self._get_model_by_id(document_id)
        if model is None:
            return None

        model.analysis = analysis

        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete_by_user(self, user_id: str) -> int:
        """Delete all documents for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            Number of documents deleted
        """
        stmt = delete(DocumentModel).where(DocumentModel.user_id == user_id)
        result = await self._session.execute(stmt)
        await self._session.flush()
        row_count: int = result.rowcount  # type: ignore[attr-defined]
        return row_count
