from typing import Optional, Dict, Any, List
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.email_repo import EmailRepository
from app.repositories.mailbox_repo import MailboxRepository
from app.services.mime_service import MimeService
from app.core.config import settings
from app.models.email import Email

logger = logging.getLogger("email_service")


class EmailService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.email_repo = EmailRepository(db)
        self.mailbox_repo = MailboxRepository(db)

    async def process_incoming_raw_email(
        self,
        raw_bytes: bytes,
        header_from: Optional[str] = None,
        header_to: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Receives raw MIME email from Cloudflare Worker, maps recipient to user mailbox,
        parses MIME content, and stores email in database.
        """
        parsed = MimeService.parse_raw_mime(raw_bytes, storage_dir=settings.STORAGE_DIR)

        # Recipient address priority: header forwarded by worker, then parsed MIME To
        target_to = header_to or parsed["clean_recipient"]
        clean_recipient = MimeService.extract_clean_email(target_to)

        if not clean_recipient:
            logger.warning(f"Could not extract valid recipient from incoming email: {target_to}")
            return {"status": "rejected", "reason": "No recipient address specified"}

        # Lookup mailbox in DB
        mailbox = await self.mailbox_repo.get_by_address(clean_recipient)
        if not mailbox or not mailbox.is_active:
            logger.warning(
                f"No active mailbox found for recipient: {clean_recipient} (request_id: {request_id})"
            )
            return {
                "status": "ignored",
                "reason": f"Recipient '{clean_recipient}' has no active mailbox in system",
            }

        sender = header_from or parsed["sender"]

        # Persist email in database
        email_obj = await self.email_repo.create(
            mailbox_id=mailbox.id,
            user_id=mailbox.user_id,
            sender=sender,
            recipient=clean_recipient,
            subject=parsed["subject"],
            cc=parsed["cc"],
            bcc=parsed["bcc"],
            message_id=parsed["message_id"],
            in_reply_to=parsed["in_reply_to"],
            references=parsed["references"],
            plain_text_body=parsed["plain_text_body"],
            html_body=parsed["html_body"],
            raw_storage_key=parsed["raw_storage_key"],
            size_bytes=parsed["size_bytes"],
            attachments=parsed["attachments"],
        )

        await self.db.commit()
        await self.db.refresh(email_obj)

        logger.info(
            f"Successfully stored email ID {email_obj.id} for user {mailbox.user_id} (mailbox: {clean_recipient})"
        )

        return {
            "status": "ok",
            "message": "Email successfully received and routed to user mailbox",
            "email_id": email_obj.id,
            "mailbox_id": mailbox.id,
            "recipient": clean_recipient,
            "request_id": request_id,
        }

    async def list_emails(
        self,
        user_id: str,
        mailbox_id: Optional[str] = None,
        page: int = 1,
        limit: int = 25,
        unread_only: bool = False,
        starred_only: bool = False,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Returns paginated lightweight email summaries.
        """
        if mailbox_id:
            mb = await self.mailbox_repo.get_by_id(mailbox_id)
            if not mb or mb.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Mailbox not found or unauthorized.",
                )

        items, total = await self.email_repo.list_paginated(
            user_id=user_id,
            mailbox_id=mailbox_id,
            page=page,
            limit=limit,
            unread_only=unread_only,
            starred_only=starred_only,
            search=search,
        )

        total_pages = (total + limit - 1) // limit if total > 0 else 1

        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        }

    async def get_email_detail(self, user_id: str, email_id: str) -> Dict[str, Any]:
        email_obj = await self.email_repo.get_by_id(email_id, user_id)
        if not email_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found.",
            )

        # Mark as read automatically when opened
        if not email_obj.is_read:
            await self.email_repo.update_status(email_obj, is_read=True)
            await self.db.commit()

        return {
            "id": email_obj.id,
            "mailbox_id": email_obj.mailbox_id,
            "mailbox_address": email_obj.mailbox.address if email_obj.mailbox else "",
            "sender": email_obj.sender,
            "recipient": email_obj.recipient,
            "cc": email_obj.cc,
            "bcc": email_obj.bcc,
            "subject": email_obj.subject,
            "message_id": email_obj.message_id,
            "in_reply_to": email_obj.in_reply_to,
            "references": email_obj.references,
            "received_at": email_obj.received_at,
            "is_read": email_obj.is_read,
            "is_starred": email_obj.is_starred,
            "size_bytes": email_obj.size_bytes,
            "plain_text_body": email_obj.plain_text_body,
            "html_body": email_obj.html_body,
            "attachments": [
                {
                    "id": att.id,
                    "filename": att.filename,
                    "content_type": att.content_type,
                    "size_bytes": att.size_bytes,
                }
                for att in email_obj.attachments
            ],
        }

    async def update_email_status(
        self,
        user_id: str,
        email_id: str,
        is_read: Optional[bool] = None,
        is_starred: Optional[bool] = None,
    ) -> Dict[str, Any]:
        email_obj = await self.email_repo.get_by_id(email_id, user_id)
        if not email_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found.",
            )

        updated = await self.email_repo.update_status(
            email_obj, is_read=is_read, is_starred=is_starred
        )
        await self.db.commit()
        return {
            "id": updated.id,
            "is_read": updated.is_read,
            "is_starred": updated.is_starred,
        }

    async def delete_email(self, user_id: str, email_id: str) -> None:
        email_obj = await self.email_repo.get_by_id(email_id, user_id)
        if not email_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found.",
            )

        await self.email_repo.delete(email_obj)
        await self.db.commit()
