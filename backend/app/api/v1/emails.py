from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.email_service import EmailService
from app.schemas.email import (
    EmailListResponse,
    EmailDetailResponse,
    EmailUpdateStatus,
)

router = APIRouter(prefix="/emails", tags=["Emails"])


@router.get("", response_model=EmailListResponse)
async def list_emails(
    mailbox_id: Optional[str] = Query(None, description="Filter by mailbox ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(25, ge=1, le=50, description="Items per page (default 25)"),
    unread_only: bool = Query(False, description="Filter only unread emails"),
    starred_only: bool = Query(False, description="Filter only starred emails"),
    search: Optional[str] = Query(None, description="Search term across subject/sender/recipient"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = EmailService(db)
    result = await service.list_emails(
        user_id=current_user.id,
        mailbox_id=mailbox_id,
        page=page,
        limit=limit,
        unread_only=unread_only,
        starred_only=starred_only,
        search=search,
    )
    return EmailListResponse(**result)


@router.get("/{email_id}", response_model=EmailDetailResponse)
async def get_email(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = EmailService(db)
    return await service.get_email_detail(current_user.id, email_id)


@router.patch("/{email_id}/status")
async def update_email_status(
    email_id: str,
    data: EmailUpdateStatus,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = EmailService(db)
    return await service.update_email_status(
        user_id=current_user.id,
        email_id=email_id,
        is_read=data.is_read,
        is_starred=data.is_starred,
    )


@router.delete("/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = EmailService(db)
    await service.delete_email(current_user.id, email_id)
