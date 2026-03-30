"""Contact form API routes.

Handles HTTP requests for contact form submissions.
"""

import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator

from src.application.interfaces.email_service import ContactFormData, IEmailService
from src.infrastructure.config import get_settings
from src.infrastructure.services.email_service import SendGridEmailService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["contact"])


def get_email_service() -> IEmailService | None:
    """Get email service instance.

    Returns:
        Configured email service or None if not configured
    """
    settings = get_settings()

    if not settings.sendgrid_api_key:
        logger.warning("Email service not configured - SENDGRID_API_KEY not set")
        return None

    return SendGridEmailService(
        api_key=settings.sendgrid_api_key,
        from_email=getattr(settings, "email_from", "noreply@publicprep.ie"),
        support_email=getattr(settings, "support_email", "support@publicprep.ie"),
        base_url=getattr(settings, "app_url", "http://localhost:5173"),
    )


# Request/Response Models


class ContactRequest(BaseModel):
    """Contact form request."""

    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=10, max_length=2000)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate email format."""
        # Simple email regex validation
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v):
            raise ValueError("Please provide a valid email address")
        return v.lower().strip()

    @field_validator("name", "subject", "message")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Strip leading/trailing whitespace."""
        return v.strip()


class ContactResponse(BaseModel):
    """Contact form response."""

    success: bool
    message: str


# Routes


@router.post(
    "/contact",
    response_model=ContactResponse,
    responses={
        400: {"description": "Invalid input"},
        500: {"description": "Failed to send message"},
    },
)
async def submit_contact_form(
    request: ContactRequest,
) -> ContactResponse:
    """Submit a contact form message.

    Sends notification email to support team and confirmation to user.
    This is a public endpoint (no authentication required).
    """
    logger.info(
        f"Contact form submission: name={request.name}, "
        f"email={request.email}, subject={request.subject[:50]}..."
    )

    email_service = get_email_service()

    if email_service and email_service.is_configured:
        # Create contact form data
        contact_data = ContactFormData(
            name=request.name,
            email=request.email,
            subject=request.subject,
            message=request.message,
        )

        # Send notification to support team
        support_sent = await email_service.send_contact_form_notification(contact_data)

        # Send confirmation to user
        confirmation_sent = await email_service.send_contact_confirmation_email(
            email=request.email,
            name=request.name,
        )

        logger.info(
            f"Contact form emails: support={support_sent}, confirmation={confirmation_sent}"
        )
    else:
        logger.warning(
            f"Email service not configured - contact form from {request.email} not sent"
        )

    # Always return success to user (we log the message regardless)
    return ContactResponse(
        success=True,
        message="Thank you for your message. We'll get back to you soon!",
    )
