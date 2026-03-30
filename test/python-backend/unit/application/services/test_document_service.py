"""Unit tests for DocumentService.

Tests document management business logic with mocked dependencies.
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from src.application.services.document_service import DocumentService
from src.domain.entities import Document
from src.domain.value_objects import DocumentType


@pytest.fixture
def mock_document_repository() -> AsyncMock:
    """Create a mock document repository."""
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.get_by_user = AsyncMock(return_value=[])
    repo.get_cv = AsyncMock(return_value=None)
    repo.create = AsyncMock()
    repo.update = AsyncMock()
    repo.delete = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def document_service(mock_document_repository: AsyncMock) -> DocumentService:
    """Create document service with mocked dependencies."""
    return DocumentService(mock_document_repository)


@pytest.fixture
def sample_document() -> Document:
    """Create a sample document for testing."""
    return Document(
        id=uuid4(),
        user_id="user-123",
        type=DocumentType.CV,
        filename="resume.pdf",
        content="This is my resume content...",
        analysis={"skills": ["Python", "FastAPI"]},
        uploaded_at=datetime.now(UTC),
    )


class TestGetUserDocuments:
    """Tests for DocumentService.get_user_documents method."""

    @pytest.mark.asyncio
    async def test_returns_user_documents(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
        sample_document: Document,
    ) -> None:
        """Should return all documents for a user."""
        mock_document_repository.get_by_user.return_value = [sample_document]

        documents = await document_service.get_user_documents("user-123")

        assert len(documents) == 1
        assert documents[0].id == sample_document.id
        mock_document_repository.get_by_user.assert_called_once_with("user-123")

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_documents(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
    ) -> None:
        """Should return empty list when user has no documents."""
        mock_document_repository.get_by_user.return_value = []

        documents = await document_service.get_user_documents("user-123")

        assert documents == []


class TestGetDocument:
    """Tests for DocumentService.get_document method."""

    @pytest.mark.asyncio
    async def test_returns_document_when_owned(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
        sample_document: Document,
    ) -> None:
        """Should return document when user owns it."""
        mock_document_repository.get_by_user.return_value = [sample_document]

        document = await document_service.get_document(
            sample_document.id, "user-123"
        )

        assert document.id == sample_document.id

    @pytest.mark.asyncio
    async def test_raises_value_error_when_not_found(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when document doesn't exist."""
        mock_document_repository.get_by_user.return_value = []

        with pytest.raises(ValueError, match="Document not found"):
            await document_service.get_document(uuid4(), "user-123")


class TestGetCvAnalysis:
    """Tests for DocumentService.get_cv_analysis method."""

    @pytest.mark.asyncio
    async def test_returns_analysis_when_cv_exists(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
        sample_document: Document,
    ) -> None:
        """Should return CV analysis when CV exists and is analyzed."""
        mock_document_repository.get_cv.return_value = sample_document

        analysis = await document_service.get_cv_analysis("user-123")

        assert analysis == sample_document.analysis
        assert "skills" in analysis

    @pytest.mark.asyncio
    async def test_raises_value_error_when_no_cv(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when no CV exists."""
        mock_document_repository.get_cv.return_value = None

        with pytest.raises(ValueError, match="No CV document found"):
            await document_service.get_cv_analysis("user-123")

    @pytest.mark.asyncio
    async def test_raises_value_error_when_not_analyzed(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
        sample_document: Document,
    ) -> None:
        """Should raise ValueError when CV is not analyzed yet."""
        sample_document.analysis = None
        mock_document_repository.get_cv.return_value = sample_document

        with pytest.raises(ValueError, match="CV not analyzed yet"):
            await document_service.get_cv_analysis("user-123")


class TestUploadDocument:
    """Tests for DocumentService.upload_document method."""

    @pytest.mark.asyncio
    async def test_uploads_document_successfully(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
        sample_document: Document,
    ) -> None:
        """Should upload and create document."""
        mock_document_repository.create.return_value = sample_document

        with patch(
            "src.application.services.document_service.extract_text_from_file",
            return_value="Extracted text content",
        ):
            document = await document_service.upload_document(
                user_id="user-123",
                doc_type="cv",
                filename="resume.txt",
                content=b"Plain text content",
            )

        assert document is not None
        mock_document_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_raises_value_error_for_invalid_type(
        self,
        document_service: DocumentService,
    ) -> None:
        """Should raise ValueError for invalid document type."""
        with pytest.raises(ValueError, match="Invalid document type"):
            await document_service.upload_document(
                user_id="user-123",
                doc_type="invalid",
                filename="test.txt",
                content=b"content",
            )

    @pytest.mark.asyncio
    async def test_raises_value_error_for_unsupported_file(
        self,
        document_service: DocumentService,
    ) -> None:
        """Should raise ValueError for unsupported file type."""
        with pytest.raises(ValueError, match="Unsupported file type"):
            await document_service.upload_document(
                user_id="user-123",
                doc_type="cv",
                filename="image.jpg",
                content=b"content",
            )

    @pytest.mark.asyncio
    async def test_raises_value_error_for_large_file(
        self,
        document_service: DocumentService,
    ) -> None:
        """Should raise ValueError for file exceeding size limit."""
        large_content = b"x" * (6 * 1024 * 1024)  # 6MB

        with pytest.raises(ValueError, match="exceeds 5MB limit"):
            await document_service.upload_document(
                user_id="user-123",
                doc_type="cv",
                filename="large.txt",
                content=large_content,
            )


class TestUpdateDocument:
    """Tests for DocumentService.update_document method."""

    @pytest.mark.asyncio
    async def test_updates_document_successfully(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
        sample_document: Document,
    ) -> None:
        """Should update document fields."""
        mock_document_repository.get_by_user.return_value = [sample_document]
        mock_document_repository.update.return_value = sample_document

        await document_service.update_document(
            document_id=sample_document.id,
            requesting_user_id="user-123",
            filename="updated.pdf",
        )

        mock_document_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_raises_value_error_when_not_found(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when document doesn't exist."""
        mock_document_repository.get_by_user.return_value = []

        with pytest.raises(ValueError, match="Document not found"):
            await document_service.update_document(
                document_id=uuid4(),
                requesting_user_id="user-123",
            )


class TestDeleteDocument:
    """Tests for DocumentService.delete_document method."""

    @pytest.mark.asyncio
    async def test_deletes_document_successfully(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
        sample_document: Document,
    ) -> None:
        """Should delete document and return True."""
        mock_document_repository.get_by_user.return_value = [sample_document]
        mock_document_repository.delete.return_value = True

        result = await document_service.delete_document(
            sample_document.id, "user-123"
        )

        assert result is True
        mock_document_repository.delete.assert_called_once_with(sample_document.id)

    @pytest.mark.asyncio
    async def test_raises_value_error_when_not_found(
        self,
        document_service: DocumentService,
        mock_document_repository: AsyncMock,
    ) -> None:
        """Should raise ValueError when document doesn't exist."""
        mock_document_repository.get_by_user.return_value = []

        with pytest.raises(ValueError, match="Document not found"):
            await document_service.delete_document(uuid4(), "user-123")
