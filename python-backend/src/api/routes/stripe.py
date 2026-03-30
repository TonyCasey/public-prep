"""Stripe payment API routes.

Handles checkout session creation and webhook processing.
"""

import logging
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select, update

from src.api.dependencies import DbSession
from src.api.middleware.auth import CurrentUser
from src.application.interfaces.stripe_service import IStripeService, StripeServiceError
from src.domain.entities import User
from src.infrastructure.config import get_settings
from src.infrastructure.services.stripe_service import StripePaymentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stripe", tags=["stripe"])


def get_stripe_service(request: Request) -> IStripeService:
    """Get Stripe service instance.

    Returns:
        Configured Stripe service

    Raises:
        HTTPException: If Stripe not configured
    """
    settings = get_settings()

    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe payment service not configured",
        )

    return StripePaymentService(
        secret_key=settings.stripe_secret_key,
        webhook_secret=settings.stripe_webhook_secret,
    )


def get_stripe_price_ids() -> dict[str, str | None]:
    """Get environment-specific Stripe price IDs."""
    settings = get_settings()

    return {
        "starter": settings.stripe_price_id_starter,
        "premium": settings.stripe_price_id_premium,
        "upgrade": settings.stripe_price_id_upgrade,
    }


# Request/Response Models


class CreateCheckoutSessionRequest(BaseModel):
    """Checkout session creation request."""

    plan_type: Literal["starter", "premium"] = Field(..., alias="planType")

    model_config = {"populate_by_name": True}


class CheckoutSessionResponse(BaseModel):
    """Checkout session response."""

    url: str | None = Field(..., description="Checkout URL")
    session_id: str = Field(..., alias="sessionId", description="Session ID")

    model_config = {"populate_by_name": True}


# Routes


@router.post(
    "/create-checkout-session",
    response_model=CheckoutSessionResponse,
    responses={
        400: {"description": "Invalid plan type"},
        401: {"description": "Not authenticated"},
        500: {"description": "Failed to create checkout session"},
        503: {"description": "Stripe not configured"},
    },
)
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    current_user: CurrentUser,
    db: DbSession,
    stripe_service: IStripeService = Depends(get_stripe_service),
) -> CheckoutSessionResponse:
    """Create a Stripe checkout session for subscription purchase."""
    settings = get_settings()
    price_ids = get_stripe_price_ids()

    # Get user's current subscription status
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Determine price ID based on plan type and current subscription
    if request.plan_type == "starter":
        price_id = price_ids.get("starter")
    elif request.plan_type == "premium":
        # Check if upgrading from starter
        if user.subscription_status == "starter":
            price_id = price_ids.get("upgrade")
        else:
            price_id = price_ids.get("premium")
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan type",
        )

    if not price_id:
        logger.error(f"Missing price ID for plan type: {request.plan_type}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Price configuration error",
        )

    try:
        # Create or get Stripe customer
        customer_id = user.stripe_customer_id

        if not customer_id:
            customer = await stripe_service.create_customer(
                email=user.email,
                name=user.first_name,
            )
            customer_id = customer.id

            # Update user with Stripe customer ID
            await db.execute(
                update(User)
                .where(User.id == current_user.id)
                .values(stripe_customer_id=customer_id)
            )
            await db.commit()

            logger.info(f"Created Stripe customer {customer_id} for user {user.id}")

        # Build checkout URLs
        base_url = settings.app_base_url or "http://localhost:5173"
        success_url = f"{base_url}/payment-success"
        cancel_url = f"{base_url}/app"

        # Create checkout session
        session = await stripe_service.create_checkout_session(
            customer_id=customer_id,
            price_id=price_id,
            success_url=success_url,
            cancel_url=cancel_url,
        )

        logger.info(
            f"Created checkout session {session.id} for user {user.id}, plan={request.plan_type}"
        )

        return CheckoutSessionResponse(
            url=session.url,
            session_id=session.id,
        )

    except StripeServiceError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post(
    "/webhook",
    responses={
        400: {"description": "Invalid webhook signature"},
        500: {"description": "Webhook processing failed"},
    },
)
async def handle_webhook(
    request: Request,
    db: DbSession,
) -> dict[str, bool]:
    """Handle Stripe webhook events.

    Processes checkout.session.completed events to update user subscriptions.
    """
    settings = get_settings()

    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe not configured",
        )

    stripe_service = StripePaymentService(
        secret_key=settings.stripe_secret_key,
        webhook_secret=settings.stripe_webhook_secret,
    )

    # Get signature header
    signature = request.headers.get("stripe-signature")
    if not signature:
        logger.error("Missing Stripe signature header")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe signature",
        )

    # Get raw body
    body = await request.body()

    try:
        event = stripe_service.construct_webhook_event(body, signature)
    except StripeServiceError as e:
        logger.error(f"Webhook verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    logger.info(f"Stripe webhook received: {event['type']}")

    # Handle checkout.session.completed
    if event["type"] == "checkout.session.completed":
        await _handle_checkout_completed(event["data"]["object"], db, stripe_service)

    return {"received": True}


async def _handle_checkout_completed(
    session: dict,
    db: DbSession,
    stripe_service: StripePaymentService,
) -> None:
    """Handle checkout.session.completed event.

    Updates user subscription status based on purchased plan.
    """
    customer_id = session.get("customer")
    if not customer_id:
        logger.error("No customer ID in checkout session")
        return

    # Find user by Stripe customer ID
    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        logger.error(f"No user found for Stripe customer: {customer_id}")
        return

    # Get line items to determine plan type
    price_ids = get_stripe_price_ids()
    plan_type = "premium"  # Default
    expires_at = None

    try:
        line_items = await stripe_service.list_checkout_session_line_items(session["id"])
        if line_items:
            price_id = line_items[0].get("price", {}).get("id")

            if price_id == price_ids.get("starter"):
                plan_type = "starter"
                # Starter plan expires in 30 days
                from datetime import datetime, timedelta

                expires_at = datetime.utcnow() + timedelta(days=30)
            elif price_id == price_ids.get("upgrade"):
                plan_type = "premium"
            elif price_id == price_ids.get("premium"):
                plan_type = "premium"

    except Exception as e:
        logger.error(f"Error fetching line items: {e}")

    # Update user subscription
    logger.info(f"Updating user {user.id} subscription to {plan_type}")

    await db.execute(
        update(User)
        .where(User.id == user.id)
        .values(
            subscription_status=plan_type,
            subscription_id=session.get("subscription") or session.get("id"),
            subscription_expires_at=expires_at,
        )
    )
    await db.commit()

    logger.info(f"Successfully updated user {user.id} to {plan_type} plan")

    # TODO: Send payment confirmation email
    # TODO: Update CRM with subscription status
