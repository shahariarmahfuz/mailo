from typing import List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.mailbox_repo import MailboxRepository
from app.schemas.mailbox import MailboxCreate, MailboxUpdate
from app.models.mailbox import Mailbox


class MailboxService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.mailbox_repo = MailboxRepository(db)

    async def list_mailboxes(self, user_id: str) -> List[Dict[str, Any]]:
        tuples = await self.mailbox_repo.get_user_mailboxes_with_counts(user_id)
        return [
            {
                "id": mb.id,
                "user_id": mb.user_id,
                "address": mb.address,
                "name": mb.name,
                "is_primary": mb.is_primary,
                "is_active": mb.is_active,
                "created_at": mb.created_at,
                "email_count": total,
                "unread_count": unread,
            }
            for mb, total, unread in tuples
        ]

    async def create_mailbox(self, user_id: str, data: MailboxCreate) -> Mailbox:
        clean_addr = data.address.lower().strip()
        existing = await self.mailbox_repo.get_by_address(clean_addr)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The email address '{clean_addr}' is already registered as a mailbox.",
            )

        mb = await self.mailbox_repo.create(
            user_id=user_id,
            address=clean_addr,
            name=data.name,
            is_primary=data.is_primary,
        )
        await self.db.commit()
        await self.db.refresh(mb)
        return mb

    async def update_mailbox(self, user_id: str, mailbox_id: str, data: MailboxUpdate) -> Mailbox:
        mb = await self.mailbox_repo.get_by_id(mailbox_id)
        if not mb or mb.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mailbox not found.",
            )

        update_fields = data.model_dump(exclude_unset=True)
        updated = await self.mailbox_repo.update(mb, **update_fields)
        await self.db.commit()
        await self.db.refresh(updated)
        return updated

    async def delete_mailbox(self, user_id: str, mailbox_id: str) -> None:
        mb = await self.mailbox_repo.get_by_id(mailbox_id)
        if not mb or mb.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mailbox not found.",
            )

        await self.mailbox_repo.delete(mb)
        await self.db.commit()
