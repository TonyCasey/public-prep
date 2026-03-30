"""Stripe service interface.

Defines the contract for payment processing operations.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class CheckoutSession:
    """Checkout session result.

    Attributes:
        id: Session ID
        url: Checkout URL to redirect user
        customer_id: Stripe customer ID
        status: Session status
    """

    id: str
    url: str | None
    customer_id: str
    status: str


@dataclass
class Customer:
    """Stripe customer.

    Attributes:
        id: Customer ID
        email: Customer email
        name: Customer name
    """

    id: str
    email: str
    name: str | None


@dataclass
class Subscription:
    """Stripe subscription.

    Attributes:
        id: Subscription ID
        customer_id: Customer ID
        status: Subscription status
        price_id: Price ID
        current_period_end: End of current billing period
    """

    id: str
    customer_id: str
    status: str
    price_id: str | None
    current_period_end: int | None


class StripeServiceError(Exception):
    """Exception raised when Stripe operations fail."""

    def __init__(
        self,
        message: str,
        stripe_error_code: str | None = None,
        original_error: Exception | None = None,
    ):
        super().__init__(message)
        self.stripe_error_code = stripe_error_code
        self.original_error = original_error


class IStripeService(ABC):
    """Interface for Stripe payment operations."""

    @abstractmethod
    async def create_checkout_session(
        self,
        customer_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
    ) -> CheckoutSession:
        """Create a Stripe checkout session.

        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID for the product
            success_url: URL to redirect on successful payment
            cancel_url: URL to redirect on cancelled payment

        Returns:
            CheckoutSession with session details and URL
        """
        ...

    @abstractmethod
    async def create_customer(
        self,
        email: str,
        name: str | None = None,
    ) -> Customer:
        """Create a Stripe customer.

        Args:
            email: Customer email
            name: Optional customer name

        Returns:
            Customer with Stripe customer details
        """
        ...

    @abstractmethod
    async def get_subscription(self, subscription_id: str) -> Subscription:
        """Get subscription details.

        Args:
            subscription_id: Stripe subscription ID

        Returns:
            Subscription details
        """
        ...

    @abstractmethod
    async def cancel_subscription(self, subscription_id: str) -> Subscription:
        """Cancel a subscription.

        Args:
            subscription_id: Stripe subscription ID

        Returns:
            Updated subscription with cancelled status
        """
        ...

    @abstractmethod
    def construct_webhook_event(
        self,
        payload: bytes,
        signature: str,
    ) -> dict[str, Any]:
        """Construct and verify a webhook event.

        Args:
            payload: Raw request body
            signature: Stripe signature header

        Returns:
            Verified webhook event data

        Raises:
            StripeServiceError: If signature verification fails
        """
        ...

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Check if the service is properly configured."""
        ...
