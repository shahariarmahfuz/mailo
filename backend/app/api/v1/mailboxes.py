from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.mailbox_service import MailboxService
from app.schemas.mailbox import MailboxCreate, MailboxUpdate, MailboxResponse

router = APIRouter(prefix="/mailboxes", tags=["Mailboxes"])


@router.get("", response_model=List[MailboxResponse])
async def list_mailboxes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MailboxService(db)
    return await service.list_mailboxes(current_user.id)


@router.post("", response_model=MailboxResponse, status_code=status.HTTP_201_CREATED)
async def create_mailbox(
    data: MailboxCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MailboxService(db)
    mb = await service.create_mailbox(current_user.id, data)
    return MailboxResponse(
        id=mb.id,
        user_id=mb.user_id,
        address=mb.address,
        name=mb.name,
        is_primary=mb.is_primary,
        is_active=mb.is_active,
        created_at=mb.created_at,
        email_count=0,
        unread_count=0,
    )


@router.patch("/{mailbox_id}", response_model=MailboxResponse)
async def update_mailbox(
    mailbox_id: str,
    data: MailboxUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MailboxService(db)
    mb = await service.update_mailbox(current_user.id, mailbox_id, data)
    return MailboxResponse(
        id=mb.id,
        user_id=mb.user_id,
        address=mb.address,
        name=mb.name,
        is_primary=mb.is_primary,
        is_active=mb.is_active,
        created_at=mb.created_at,
        email_count=0,
        unread_count=0,
    )


@router.delete("/{mailbox_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mailbox(
    mailbox_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MailboxService(db)
    await service.delete_mailbox(current_user.id, mailbox_id)
