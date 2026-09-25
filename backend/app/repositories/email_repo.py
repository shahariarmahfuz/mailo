from typing import List, Optional, Tuple, Any, Dict
from datetime import datetime, timezone
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.email import Email, EmailAttachment
from app.models.mailbox import Mailbox


class EmailRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, email_id: str, user_id: str) -> Optional[Email]:
        stmt = (
            select(Email)
            .options(
                selectinload(Email.mailbox),
                selectinload(Email.attachments),
            )
            .where(and_(Email.id == email_id, Email.user_id == user_id))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_paginated(
        self,
        user_id: str,
        mailbox_id: Optional[str] = None,
        page: int = 1,
        limit: int = 25,
        unread_only: bool = False,
        starred_only: bool = False,
        search: Optional[str] = None,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Retrieves paginated email summaries WITHOUT body content for performance.
        Includes total count for pagination metadata.
        """
        page = max(1, page)
        limit = min(max(1, limit), 50)  # enforce max 50, default 25
        offset = (page - 1) * limit

        # Base conditions
        conditions = [Email.user_id == user_id]
        if mailbox_id:
            conditions.append(Email.mailbox_id == mailbox_id)
        if unread_only:
            conditions.append(Email.is_read == False)
        if starred_only:
            conditions.append(Email.is_starred == True)
        if search:
            search_pattern = f"%{search.strip()}%"
            conditions.append(
                or_(
                    Email.subject.ilike(search_pattern),
                    Email.sender.ilike(search_pattern),
                    Email.recipient.ilike(search_pattern),
                )
            )

        # Count total
        count_stmt = select(func.count(Email.id)).where(and_(*conditions))
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one_or_none() or 0

        # Query summaries only (exclude bodies) + join Mailbox for address
        stmt = (
            select(
                Email.id,
                Email.mailbox_id,
                Mailbox.address.label("mailbox_address"),
                Email.sender,
                Email.recipient,
                Email.subject,
                Email.received_at,
                Email.is_read,
                Email.is_starred,
                Email.size_bytes,
                func.count(EmailAttachment.id).label("attachment_count"),
            )
            .join(Mailbox, Email.mailbox_id == Mailbox.id)
            .outerjoin(EmailAttachment, EmailAttachment.email_id == Email.id)
            .where(and_(*conditions))
            .group_by(Email.id, Mailbox.address)
            .order_by(desc(Email.received_at))
            .offset(offset)
            .limit(limit)
        )

        rows = (await self.db.execute(stmt)).all()

        items = [
            {
                "id": r.id,
                "mailbox_id": r.mailbox_id,
                "mailbox_address": r.mailbox_address,
                "sender": r.sender,
                "recipient": r.recipient,
                "subject": r.subject,
                "received_at": r.received_at,
                "is_read": r.is_read,
                "is_starred": r.is_starred,
                "size_bytes": r.size_bytes,
                "has_attachments": (r.attachment_count or 0) > 0,
            }
            for r in rows
        ]

        return items, total

    async def create(
        self,
        mailbox_id: str,
        user_id: str,
        sender: str,
        recipient: str,
        subject: str,
        cc: Optional[str] = None,
        bcc: Optional[str] = None,
        message_id: Optional[str] = None,
        in_reply_to: Optional[str] = None,
        references: Optional[str] = None,
        plain_text_body: Optional[str] = None,
        html_body: Optional[str] = None,
        raw_storage_key: Optional[str] = None,
        size_bytes: int = 0,
        received_at: Optional[datetime] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> Email:
        email_obj = Email(
            mailbox_id=mailbox_id,
            user_id=user_id,
            sender=sender,
            recipient=recipient,
            cc=cc,
            bcc=bcc,
            subject=subject,
            message_id=message_id,
            in_reply_to=in_reply_to,
            references=references,
            plain_text_body=plain_text_body,
            html_body=html_body,
            raw_storage_key=raw_storage_key,
            size_bytes=size_bytes,
            received_at=received_at or datetime.now(timezone.utc),
            is_read=False,
            is_starred=False,
        )
        self.db.add(email_obj)
        await self.db.flush()

        if attachments:
            for att in attachments:
                attachment_obj = EmailAttachment(
                    email_id=email_obj.id,
                    filename=att.get("filename", "attachment"),
                    content_type=att.get("content_type", "application/octet-stream"),
                    size_bytes=att.get("size_bytes", 0),
                    storage_path=att.get("storage_path"),
                )
                self.db.add(attachment_obj)
            await self.db.flush()

        return email_obj

    async def update_status(
        self, email: Email, is_read: Optional[bool] = None, is_starred: Optional[bool] = None
    ) -> Email:
        if is_read is not None:
            email.is_read = is_read
        if is_starred is not None:
            email.is_starred = is_starred
        await self.db.flush()
        return email

    async def delete(self, email: Email) -> None:
        await self.db.delete(email)
        await self.db.flush()
