"""Stripe payment service implementation.

Provides payment processing using Stripe API.
"""

import logging
from typing import Any

from src.application.interfaces.stripe_service import (
    CheckoutSession,
    Customer,
    IStripeService,
    StripeServiceError,
    Subscription,
)

logger = logging.getLogger(__name__)


class StripePaymentService(IStripeService):
    """Stripe payment service implementation."""

    def __init__(
        self,
        secret_key: str | None,
        webhook_secret: str | None = None,
    ) -> None:
        """Initialize Stripe payment service.

        Args:
            secret_key: Stripe secret key
            webhook_secret: Stripe webhook signing secret
        """
        self._secret_key = secret_key
        self._webhook_secret = webhook_secret
        self._client = None

        if secret_key:
            try:
                import stripe

                stripe.api_key = secret_key
                self._client = stripe
                logger.info(
                    f"Stripe initialized with key type: "
                    f"{'test' if secret_key.startswith('sk_test_') else 'live'}"
                )
            except ImportError:
                logger.warning("stripe package not installed")

    @property
    def is_configured(self) -> bool:
        """Check if the service is properly configured."""
        return self._client is not None and self._secret_key is not None

    async def create_checkout_session(
        self,
        customer_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
    ) -> CheckoutSession:
        """Create a Stripe checkout session."""
        if not self.is_configured:
            raise StripeServiceError("Stripe is not configured")

        try:
            logger.info(
                f"Creating checkout session: customer={customer_id}, price={price_id}"
            )

            session = self._client.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                automatic_tax={"enabled": False},
                billing_address_collection="auto",
            )

            logger.info(f"Checkout session created: {session.id}")

            return CheckoutSession(
                id=session.id,
                url=session.url,
                customer_id=customer_id,
                status=session.status,
            )

        except self._client.error.StripeError as e:
            logger.error(f"Stripe error creating checkout session: {e}")
            raise StripeServiceError(
                message=str(e.user_message or e),
                stripe_error_code=e.code,
                original_error=e,
            )
        except Exception as e:
            logger.error(f"Error creating checkout session: {e}")
            raise StripeServiceError(
                message="Failed to create checkout session",
                original_error=e,
            )

    async def create_customer(
        self,
        email: str,
        name: str | None = None,
    ) -> Customer:
        """Create a Stripe customer."""
        if not self.is_configured:
            raise StripeServiceError("Stripe is not configured")

        try:
            logger.info(f"Creating Stripe customer: {email}")

            customer = self._client.Customer.create(
                email=email,
                name=name,
            )

            logger.info(f"Stripe customer created: {customer.id}")

            return Customer(
                id=customer.id,
                email=customer.email,
                name=customer.name,
            )

        except self._client.error.StripeError as e:
            logger.error(f"Stripe error creating customer: {e}")
            raise StripeServiceError(
                message=str(e.user_message or e),
                stripe_error_code=e.code,
                original_error=e,
            )
        except Exception as e:
            logger.error(f"Error creating customer: {e}")
            raise StripeServiceError(
                message="Failed to create customer",
                original_error=e,
            )

    async def get_subscription(self, subscription_id: str) -> Subscription:
        """Get subscription details."""
        if not self.is_configured:
            raise StripeServiceError("Stripe is not configured")

        try:
            sub = self._client.Subscription.retrieve(subscription_id)

            return Subscription(
                id=sub.id,
                customer_id=sub.customer,
                status=sub.status,
                price_id=sub.items.data[0].price.id if sub.items.data else None,
                current_period_end=sub.current_period_end,
            )

        except self._client.error.StripeError as e:
            logger.error(f"Stripe error getting subscription: {e}")
            raise StripeServiceError(
                message=str(e.user_message or e),
                stripe_error_code=e.code,
                original_error=e,
            )
        except Exception as e:
            logger.error(f"Error getting subscription: {e}")
            raise StripeServiceError(
                message="Failed to get subscription",
                original_error=e,
            )

    async def cancel_subscription(self, subscription_id: str) -> Subscription:
        """Cancel a subscription."""
        if not self.is_configured:
            raise StripeServiceError("Stripe is not configured")

        try:
            logger.info(f"Cancelling subscription: {subscription_id}")

            sub = self._client.Subscription.cancel(subscription_id)

            logger.info(f"Subscription cancelled: {subscription_id}")

            return Subscription(
                id=sub.id,
                customer_id=sub.customer,
                status=sub.status,
                price_id=sub.items.data[0].price.id if sub.items.data else None,
                current_period_end=sub.current_period_end,
            )

        except self._client.error.StripeError as e:
            logger.error(f"Stripe error cancelling subscription: {e}")
            raise StripeServiceError(
                message=str(e.user_message or e),
                stripe_error_code=e.code,
                original_error=e,
            )
        except Exception as e:
            logger.error(f"Error cancelling subscription: {e}")
            raise StripeServiceError(
                message="Failed to cancel subscription",
                original_error=e,
            )

    def construct_webhook_event(
        self,
        payload: bytes,
        signature: str,
    ) -> dict[str, Any]:
        """Construct and verify a webhook event."""
        if not self.is_configured:
            raise StripeServiceError("Stripe is not configured")

        if not self._webhook_secret:
            raise StripeServiceError("Webhook secret not configured")

        try:
            event = self._client.Webhook.construct_event(
                payload=payload,
                sig_header=signature,
                secret=self._webhook_secret,
            )

            logger.info(f"Webhook event verified: {event['type']}")

            return dict(event)

        except self._client.error.SignatureVerificationError as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise StripeServiceError(
                message="Invalid webhook signature",
                original_error=e,
            )
        except Exception as e:
            logger.error(f"Error constructing webhook event: {e}")
            raise StripeServiceError(
                message="Failed to verify webhook",
                original_error=e,
            )

    async def list_checkout_session_line_items(
        self, session_id: str
    ) -> list[dict[str, Any]]:
        """List line items for a checkout session.

        Args:
            session_id: Checkout session ID

        Returns:
            List of line items
        """
        if not self.is_configured:
            raise StripeServiceError("Stripe is not configured")

        try:
            line_items = self._client.checkout.Session.list_line_items(session_id)
            return [dict(item) for item in line_items.data]

        except self._client.error.StripeError as e:
            logger.error(f"Stripe error listing line items: {e}")
            raise StripeServiceError(
                message=str(e.user_message or e),
                stripe_error_code=e.code,
                original_error=e,
            )
        except Exception as e:
            logger.error(f"Error listing line items: {e}")
            raise StripeServiceError(
                message="Failed to list line items",
                original_error=e,
            )
