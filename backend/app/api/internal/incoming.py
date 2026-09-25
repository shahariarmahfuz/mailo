from typing import Optional
from fastapi import APIRouter, Request, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.email_service import EmailService
from app.core.config import settings
import logging

logger = logging.getLogger("incoming_api")

router = APIRouter(prefix="/internal/email", tags=["Internal Worker Webhook"])


@router.get("/incoming")
async def incoming_health():
    """Health check for worker endpoint reachability."""
    return {
        "status": "ok",
        "service": "Mailo Internal Email Ingestion",
        "supported_content_type": "message/rfc822",
    }


@router.post("/incoming")
async def receive_worker_email(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Optional internal security token verification if configured
    if settings.INTERNAL_API_KEY:
        auth_header = request.headers.get("x-internal-secret") or request.headers.get("authorization")
        if auth_header != settings.INTERNAL_API_KEY:
            logger.warning("Rejected incoming worker request: Invalid internal secret")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid internal authorization secret.",
            )

    body = await request.body()
    if not body:
        logger.warning("Rejected incoming worker request: Empty email body")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty MIME email body received.",
        )

    # Read worker headers
    sender_header = (
        request.headers.get("x-email-from")
        or request.headers.get("from")
        or None
    )
    recipient_header = (
        request.headers.get("x-email-to")
        or request.headers.get("to")
        or None
    )
    request_id = (
        request.headers.get("x-request-id")
        or request.headers.get("request-id")
        or None
    )

    logger.info(
        f"Incoming email webhook received | From: {sender_header} | To: {recipient_header} | Size: {len(body)} bytes | ReqID: {request_id}"
    )

    service = EmailService(db)
    result = await service.process_incoming_raw_email(
        raw_bytes=body,
        header_from=sender_header,
        header_to=recipient_header,
        request_id=request_id,
    )

    return result
