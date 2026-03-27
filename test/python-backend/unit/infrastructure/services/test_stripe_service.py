"""Unit tests for Stripe payment service.

Tests StripePaymentService with mocked Stripe client.
"""

from unittest.mock import MagicMock, patch

import pytest

from src.application.interfaces.stripe_service import StripeServiceError
from src.infrastructure.services.stripe_service import StripePaymentService


class TestStripePaymentService:
    """Tests for StripePaymentService."""

    def test_is_configured_with_api_key(self) -> None:
        """Should be configured when API key provided."""
        with patch("src.infrastructure.services.stripe_service.stripe") as mock_stripe:
            service = StripePaymentService(secret_key="sk_test_123")
            assert service.is_configured is True

    def test_not_configured_without_api_key(self) -> None:
        """Should not be configured when API key is None."""
        service = StripePaymentService(secret_key=None)
        assert service.is_configured is False

    @pytest.mark.asyncio
    async def test_create_customer_successfully(self) -> None:
        """Should create customer when properly configured."""
        with patch("src.infrastructure.services.stripe_service.stripe") as mock_stripe:
            mock_customer = MagicMock()
            mock_customer.id = "cus_123"
            mock_customer.email = "test@example.com"
            mock_customer.name = "Test User"

            mock_stripe.Customer.create.return_value = mock_customer

            service = StripePaymentService(secret_key="sk_test_123")
            customer = await service.create_customer(
                email="test@example.com",
                name="Test User",
            )

            assert customer.id == "cus_123"
            assert customer.email == "test@example.com"
            mock_stripe.Customer.create.assert_called_once_with(
                email="test@example.com",
                name="Test User",
            )

    @pytest.mark.asyncio
    async def test_create_customer_raises_error_when_not_configured(self) -> None:
        """Should raise error when not configured."""
        service = StripePaymentService(secret_key=None)

        with pytest.raises(StripeServiceError, match="not configured"):
            await service.create_customer(email="test@example.com")

    @pytest.mark.asyncio
    async def test_create_checkout_session_successfully(self) -> None:
        """Should create checkout session."""
        with patch("src.infrastructure.services.stripe_service.stripe") as mock_stripe:
            mock_session = MagicMock()
            mock_session.id = "cs_123"
            mock_session.url = "https://checkout.stripe.com/123"
            mock_session.status = "open"

            mock_stripe.checkout.Session.create.return_value = mock_session

            service = StripePaymentService(secret_key="sk_test_123")
            session = await service.create_checkout_session(
                customer_id="cus_123",
                price_id="price_123",
                success_url="https://example.com/success",
                cancel_url="https://example.com/cancel",
            )

            assert session.id == "cs_123"
            assert session.url == "https://checkout.stripe.com/123"

    @pytest.mark.asyncio
    async def test_get_subscription_successfully(self) -> None:
        """Should retrieve subscription."""
        with patch("src.infrastructure.services.stripe_service.stripe") as mock_stripe:
            mock_sub = MagicMock()
            mock_sub.id = "sub_123"
            mock_sub.customer = "cus_123"
            mock_sub.status = "active"
            mock_sub.items.data = [MagicMock(price=MagicMock(id="price_123"))]
            mock_sub.current_period_end = 1234567890

            mock_stripe.Subscription.retrieve.return_value = mock_sub

            service = StripePaymentService(secret_key="sk_test_123")
            subscription = await service.get_subscription("sub_123")

            assert subscription.id == "sub_123"
            assert subscription.status == "active"
            mock_stripe.Subscription.retrieve.assert_called_once_with("sub_123")

    @pytest.mark.asyncio
    async def test_cancel_subscription_successfully(self) -> None:
        """Should cancel subscription."""
        with patch("src.infrastructure.services.stripe_service.stripe") as mock_stripe:
            mock_sub = MagicMock()
            mock_sub.id = "sub_123"
            mock_sub.customer = "cus_123"
            mock_sub.status = "canceled"
            mock_sub.items.data = []
            mock_sub.current_period_end = 1234567890

            mock_stripe.Subscription.cancel.return_value = mock_sub

            service = StripePaymentService(secret_key="sk_test_123")
            subscription = await service.cancel_subscription("sub_123")

            assert subscription.id == "sub_123"
            assert subscription.status == "canceled"

    def test_construct_webhook_event_successfully(self) -> None:
        """Should construct and verify webhook event."""
        with patch("src.infrastructure.services.stripe_service.stripe") as mock_stripe:
            mock_event = {
                "id": "evt_123",
                "type": "checkout.session.completed",
                "data": {"object": {}},
            }
            mock_stripe.Webhook.construct_event.return_value = mock_event

            service = StripePaymentService(
                secret_key="sk_test_123",
                webhook_secret="whsec_123",
            )

            event = service.construct_webhook_event(
                payload=b"test payload",
                signature="test_sig",
            )

            assert event["type"] == "checkout.session.completed"

    def test_construct_webhook_event_raises_error_without_secret(self) -> None:
        """Should raise error when webhook secret not configured."""
        with patch("src.infrastructure.services.stripe_service.stripe"):
            service = StripePaymentService(
                secret_key="sk_test_123",
                webhook_secret=None,
            )

            with pytest.raises(StripeServiceError, match="Webhook secret"):
                service.construct_webhook_event(
                    payload=b"test payload",
                    signature="test_sig",
                )
