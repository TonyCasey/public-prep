"""Tests for DocumentRepository implementation."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from src.domain.entities import Document
from src.domain.value_objects import DocumentType
from src.infrastructure.database.models import Document as DocumentModel
from src.infrastructure.repositories import DocumentRepository


@pytest.fixture
def mock_session() -> AsyncMock:
    """Create a mock SQLAlchemy async session."""
    session = AsyncMock()
    return session


@pytest.fixture
def repository(mock_session: AsyncMock) -> DocumentRepository:
    """Create a DocumentRepository with a mocked session."""
    return DocumentRepository(mock_session)


@pytest.fixture
def sample_document_model() -> DocumentModel:
    """Create a sample DocumentModel for testing."""
    model = MagicMock(spec=DocumentModel)
    model.id = uuid4()
    model.user_id = "user-123"
    model.type = "cv"
    model.filename = "my_cv.pdf"
    model.content = "John Smith - Senior Developer..."
    model.analysis = {"skills": ["Python", "TypeScript"]}
    model.uploaded_at = datetime.now(UTC)
    return model


@pytest.fixture
def sample_document_entity() -> Document:
    """Create a sample Document entity for testing."""
    return Document(
        id=uuid4(),
        user_id="user-123",
        type=DocumentType.CV,
        filename="my_cv.pdf",
        content="John Smith - Senior Developer...",
        analysis={"skills": ["Python", "TypeScript"]},
        uploaded_at=datetime.now(UTC),
    )


class TestDocumentRepositoryConversion:
    """Tests for entity/model conversion methods."""

    def test_to_entity(
        self, repository: DocumentRepository, sample_document_model: DocumentModel
    ) -> None:
        """Test converting model to entity."""
        entity = repository._to_entity(sample_document_model)

        assert entity.id == sample_document_model.id
        assert entity.user_id == sample_document_model.user_id
        assert entity.type == DocumentType.CV
        assert entity.filename == sample_document_model.filename
        assert entity.content == sample_document_model.content
        assert entity.analysis == sample_document_model.analysis

    def test_to_model(
        self, repository: DocumentRepository, sample_document_entity: Document
    ) -> None:
        """Test converting entity to model."""
        model = repository._to_model(sample_document_entity)

        assert model.id == sample_document_entity.id
        assert model.user_id == sample_document_entity.user_id
        assert model.type == "cv"
        assert model.filename == sample_document_entity.filename


class TestDocumentRepositoryQueries:
    """Tests for document-specific query methods."""

    @pytest.mark.asyncio
    async def test_get_by_user(
        self,
        repository: DocumentRepository,
        mock_session: AsyncMock,
        sample_document_model: DocumentModel,
    ) -> None:
        """Test getting documents by user ID."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_document_model]
        mock_session.execute.return_value = mock_result

        documents = await repository.get_by_user("user-123")

        assert len(documents) == 1
        assert documents[0].user_id == "user-123"

    @pytest.mark.asyncio
    async def test_get_by_user_with_type_filter(
        self,
        repository: DocumentRepository,
        mock_session: AsyncMock,
        sample_document_model: DocumentModel,
    ) -> None:
        """Test getting documents by user ID and type."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_document_model]
        mock_session.execute.return_value = mock_result

        documents = await repository.get_by_user("user-123", doc_type=DocumentType.CV)

        assert len(documents) == 1
        assert documents[0].type == DocumentType.CV

    @pytest.mark.asyncio
    async def test_get_latest_by_type_found(
        self,
        repository: DocumentRepository,
        mock_session: AsyncMock,
        sample_document_model: DocumentModel,
    ) -> None:
        """Test getting latest document by type."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_document_model
        mock_session.execute.return_value = mock_result

        document = await repository.get_latest_by_type("user-123", DocumentType.CV)

        assert document is not None
        assert document.type == DocumentType.CV

    @pytest.mark.asyncio
    async def test_get_latest_by_type_not_found(
        self,
        repository: DocumentRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test getting latest document when none exists."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        document = await repository.get_latest_by_type("user-123", DocumentType.JOB_SPEC)

        assert document is None

    @pytest.mark.asyncio
    async def test_get_cv(
        self,
        repository: DocumentRepository,
        mock_session: AsyncMock,
        sample_document_model: DocumentModel,
    ) -> None:
        """Test convenience method for getting CV."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_document_model
        mock_session.execute.return_value = mock_result

        document = await repository.get_cv("user-123")

        assert document is not None
        assert document.type == DocumentType.CV

    @pytest.mark.asyncio
    async def test_get_job_spec(
        self,
        repository: DocumentRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test convenience method for getting job spec."""
        job_spec_model = MagicMock(spec=DocumentModel)
        job_spec_model.id = uuid4()
        job_spec_model.user_id = "user-123"
        job_spec_model.type = "job_spec"
        job_spec_model.filename = "job_description.pdf"
        job_spec_model.content = "Executive Officer position..."
        job_spec_model.analysis = None
        job_spec_model.uploaded_at = datetime.now(UTC)

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = job_spec_model
        mock_session.execute.return_value = mock_result

        document = await repository.get_job_spec("user-123")

        assert document is not None
        assert document.type == DocumentType.JOB_SPEC


class TestDocumentRepositoryUpdates:
    """Tests for document update operations."""

    @pytest.mark.asyncio
    async def test_update_analysis(
        self,
        repository: DocumentRepository,
        mock_session: AsyncMock,
        sample_document_model: DocumentModel,
    ) -> None:
        """Test updating document analysis."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_document_model
        mock_session.execute.return_value = mock_result

        new_analysis = {"skills": ["Python", "TypeScript", "Go"]}
        document = await repository.update_analysis(sample_document_model.id, new_analysis)

        assert document is not None
        mock_session.flush.assert_called()
        mock_session.refresh.assert_called_with(sample_document_model)

    @pytest.mark.asyncio
    async def test_update_analysis_not_found(
        self,
        repository: DocumentRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test updating analysis when document not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        document = await repository.update_analysis(uuid4(), {"skills": []})

        assert document is None

    @pytest.mark.asyncio
    async def test_delete_by_user(
        self,
        repository: DocumentRepository,
        mock_session: AsyncMock,
    ) -> None:
        """Test deleting all documents for a user."""
        mock_result = MagicMock()
        mock_result.rowcount = 3
        mock_session.execute.return_value = mock_result

        count = await repository.delete_by_user("user-123")

        assert count == 3
        mock_session.flush.assert_called()
