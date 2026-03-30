"""Unit tests for SendGrid email service.

Tests SendGridEmailService with mocked SendGrid client.
"""

import sys
from unittest.mock import MagicMock, patch

import pytest

from src.application.interfaces.email_service import (
    ContactFormData,
    InterviewSessionDetails,
    MilestoneDetails,
)


class TestSendGridEmailService:
    """Tests for SendGridEmailService."""

    def _create_mock_sendgrid_modules(self) -> tuple[MagicMock, MagicMock]:
        """Create mock sendgrid modules."""
        mock_sendgrid = MagicMock()
        mock_helpers = MagicMock()

        # Set up the mail helpers
        mock_mail = MagicMock()
        mock_helpers.mail = mock_mail
        mock_helpers.mail.Content = MagicMock()
        mock_helpers.mail.Email = MagicMock()
        mock_helpers.mail.Mail = MagicMock()
        mock_helpers.mail.To = MagicMock()

        return mock_sendgrid, mock_helpers

    def test_is_configured_with_api_key(self) -> None:
        """Should be configured when API key provided."""
        mock_sendgrid, mock_helpers = self._create_mock_sendgrid_modules()
        mock_client = MagicMock()
        mock_sendgrid.SendGridAPIClient.return_value = mock_client

        with patch.dict(
            sys.modules,
            {
                "sendgrid": mock_sendgrid,
                "sendgrid.helpers": mock_helpers,
                "sendgrid.helpers.mail": mock_helpers.mail,
            },
        ):
            from src.infrastructure.services.email_service import SendGridEmailService

            service = SendGridEmailService(api_key="SG.test_key")
            assert service.is_configured is True

    def test_not_configured_without_api_key(self) -> None:
        """Should not be configured when API key is None."""
        from src.infrastructure.services.email_service import SendGridEmailService

        service = SendGridEmailService(api_key=None)
        assert service.is_configured is False

    @pytest.mark.asyncio
    async def test_send_welcome_email_when_not_configured(self) -> None:
        """Should return False when not configured."""
        from src.infrastructure.services.email_service import SendGridEmailService

        service = SendGridEmailService(api_key=None)

        result = await service.send_welcome_email(
            email="test@example.com",
            first_name="Test",
        )

        assert result is False

    @pytest.mark.asyncio
    async def test_send_welcome_email_successfully(self) -> None:
        """Should send welcome email when configured."""
        mock_sendgrid, mock_helpers = self._create_mock_sendgrid_modules()
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_client.send.return_value = mock_response
        mock_sendgrid.SendGridAPIClient.return_value = mock_client

        with patch.dict(
            sys.modules,
            {
                "sendgrid": mock_sendgrid,
                "sendgrid.helpers": mock_helpers,
                "sendgrid.helpers.mail": mock_helpers.mail,
            },
        ):
            from src.infrastructure.services.email_service import SendGridEmailService

            service = SendGridEmailService(api_key="SG.test_key")

            result = await service.send_welcome_email(
                email="test@example.com",
                first_name="Test",
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_send_password_reset_email_successfully(self) -> None:
        """Should send password reset email."""
        mock_sendgrid, mock_helpers = self._create_mock_sendgrid_modules()
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_client.send.return_value = mock_response
        mock_sendgrid.SendGridAPIClient.return_value = mock_client

        with patch.dict(
            sys.modules,
            {
                "sendgrid": mock_sendgrid,
                "sendgrid.helpers": mock_helpers,
                "sendgrid.helpers.mail": mock_helpers.mail,
            },
        ):
            from src.infrastructure.services.email_service import SendGridEmailService

            service = SendGridEmailService(
                api_key="SG.test_key",
                base_url="https://example.com",
            )

            result = await service.send_password_reset_email(
                email="test@example.com",
                reset_token="abc123",
                first_name="Test",
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_send_payment_confirmation_email_starter(self) -> None:
        """Should send starter plan confirmation email."""
        mock_sendgrid, mock_helpers = self._create_mock_sendgrid_modules()
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_client.send.return_value = mock_response
        mock_sendgrid.SendGridAPIClient.return_value = mock_client

        with patch.dict(
            sys.modules,
            {
                "sendgrid": mock_sendgrid,
                "sendgrid.helpers": mock_helpers,
                "sendgrid.helpers.mail": mock_helpers.mail,
            },
        ):
            from src.infrastructure.services.email_service import SendGridEmailService

            service = SendGridEmailService(api_key="SG.test_key")

            result = await service.send_payment_confirmation_email(
                email="test@example.com",
                first_name="Test",
                amount=49.00,
                plan_type="starter",
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_send_payment_confirmation_email_premium(self) -> None:
        """Should send premium plan confirmation email."""
        mock_sendgrid, mock_helpers = self._create_mock_sendgrid_modules()
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_client.send.return_value = mock_response
        mock_sendgrid.SendGridAPIClient.return_value = mock_client

        with patch.dict(
            sys.modules,
            {
                "sendgrid": mock_sendgrid,
                "sendgrid.helpers": mock_helpers,
                "sendgrid.helpers.mail": mock_helpers.mail,
            },
        ):
            from src.infrastructure.services.email_service import SendGridEmailService

            service = SendGridEmailService(api_key="SG.test_key")

            result = await service.send_payment_confirmation_email(
                email="test@example.com",
                first_name="Test",
                amount=149.00,
                plan_type="premium",
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_send_interview_completion_email(self) -> None:
        """Should send interview completion email."""
        mock_sendgrid, mock_helpers = self._create_mock_sendgrid_modules()
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_client.send.return_value = mock_response
        mock_sendgrid.SendGridAPIClient.return_value = mock_client

        with patch.dict(
            sys.modules,
            {
                "sendgrid": mock_sendgrid,
                "sendgrid.helpers": mock_helpers,
                "sendgrid.helpers.mail": mock_helpers.mail,
            },
        ):
            from src.infrastructure.services.email_service import SendGridEmailService

            service = SendGridEmailService(api_key="SG.test_key")

            session_details = InterviewSessionDetails(
                job_title="HEO",
                overall_score=75.0,
                competencies_passed=5,
                total_competencies=6,
                duration="45 minutes",
                grade="HEO",
            )

            result = await service.send_interview_completion_email(
                email="test@example.com",
                first_name="Test",
                session_details=session_details,
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_send_contact_form_notification(self) -> None:
        """Should send contact form notification."""
        mock_sendgrid, mock_helpers = self._create_mock_sendgrid_modules()
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_client.send.return_value = mock_response
        mock_sendgrid.SendGridAPIClient.return_value = mock_client

        with patch.dict(
            sys.modules,
            {
                "sendgrid": mock_sendgrid,
                "sendgrid.helpers": mock_helpers,
                "sendgrid.helpers.mail": mock_helpers.mail,
            },
        ):
            from src.infrastructure.services.email_service import SendGridEmailService

            service = SendGridEmailService(api_key="SG.test_key")

            contact_data = ContactFormData(
                name="Test User",
                email="test@example.com",
                subject="Question",
                message="Hello, I have a question.",
            )

            result = await service.send_contact_form_notification(contact_data)

            assert result is True

    @pytest.mark.asyncio
    async def test_send_milestone_achievement_email(self) -> None:
        """Should send milestone achievement email."""
        mock_sendgrid, mock_helpers = self._create_mock_sendgrid_modules()
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_client.send.return_value = mock_response
        mock_sendgrid.SendGridAPIClient.return_value = mock_client

        with patch.dict(
            sys.modules,
            {
                "sendgrid": mock_sendgrid,
                "sendgrid.helpers": mock_helpers,
                "sendgrid.helpers.mail": mock_helpers.mail,
            },
        ):
            from src.infrastructure.services.email_service import SendGridEmailService

            service = SendGridEmailService(api_key="SG.test_key")

            milestone = MilestoneDetails(
                type="score_improvement",
                description="You improved your Team Leadership score!",
                competency="Team Leadership",
                old_score=60.0,
                new_score=80.0,
            )

            result = await service.send_milestone_achievement_email(
                email="test@example.com",
                first_name="Test",
                milestone=milestone,
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_send_email_handles_error(self) -> None:
        """Should handle send errors gracefully."""
        mock_sendgrid, mock_helpers = self._create_mock_sendgrid_modules()
        mock_client = MagicMock()
        mock_client.send.side_effect = Exception("API error")
        mock_sendgrid.SendGridAPIClient.return_value = mock_client

        with patch.dict(
            sys.modules,
            {
                "sendgrid": mock_sendgrid,
                "sendgrid.helpers": mock_helpers,
                "sendgrid.helpers.mail": mock_helpers.mail,
            },
        ):
            from src.infrastructure.services.email_service import SendGridEmailService

            service = SendGridEmailService(api_key="SG.test_key")

            result = await service.send_welcome_email(
                email="test@example.com",
                first_name="Test",
            )

            assert result is False
