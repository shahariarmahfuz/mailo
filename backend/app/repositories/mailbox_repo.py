from typing import List, Optional, Tuple
from sqlalchemy import select, func, update, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.mailbox import Mailbox
from app.models.email import Email


class MailboxRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, mailbox_id: str) -> Optional[Mailbox]:
        result = await self.db.execute(select(Mailbox).where(Mailbox.id == mailbox_id))
        return result.scalars().first()

    async def get_by_address(self, address: str) -> Optional[Mailbox]:
        normalized = address.lower().strip()
        result = await self.db.execute(
            select(Mailbox).where(Mailbox.address == normalized)
        )
        return result.scalars().first()

    async def get_user_mailboxes_with_counts(self, user_id: str) -> List[Tuple[Mailbox, int, int]]:
        """
        Returns mailboxes for a user along with (total_emails, unread_emails).
        Uses single aggregated query to avoid N+1.
        """
        # Outer join to emails to aggregate counts
        stmt = (
            select(
                Mailbox,
                func.count(Email.id).label("total_count"),
                func.count(func.nullif(Email.is_read, True)).label("unread_count"),
            )
            .outerjoin(Email, Email.mailbox_id == Mailbox.id)
            .where(Mailbox.user_id == user_id)
            .group_by(Mailbox.id)
            .order_by(Mailbox.is_primary.desc(), Mailbox.created_at.asc())
        )
        result = await self.db.execute(stmt)
        return [(row[0], row[1], row[2]) for row in result.all()]

    async def create(
        self, user_id: str, address: str, name: str, is_primary: bool = False
    ) -> Mailbox:
        normalized = address.lower().strip()
        if is_primary:
            # Demote others
            await self.db.execute(
                update(Mailbox)
                .where(Mailbox.user_id == user_id)
                .values(is_primary=False)
            )

        mailbox = Mailbox(
            user_id=user_id,
            address=normalized,
            name=name.strip(),
            is_primary=is_primary,
            is_active=True,
        )
        self.db.add(mailbox)
        await self.db.flush()
        return mailbox

    async def update(self, mailbox: Mailbox, **kwargs) -> Mailbox:
        if kwargs.get("is_primary") is True:
            await self.db.execute(
                update(Mailbox)
                .where(and_(Mailbox.user_id == mailbox.user_id, Mailbox.id != mailbox.id))
                .values(is_primary=False)
            )
        for key, value in kwargs.items():
            if value is not None and hasattr(mailbox, key):
                setattr(mailbox, key, value)
        await self.db.flush()
        return mailbox

    async def delete(self, mailbox: Mailbox) -> None:
        await self.db.delete(mailbox)
        await self.db.flush()
