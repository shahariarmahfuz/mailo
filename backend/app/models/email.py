from datetime import datetime, timezone
import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Integer,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.mailbox import Mailbox


class Email(Base):
    __tablename__ = "emails"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    mailbox_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("mailboxes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Email Headers & Metadata
    sender: Mapped[str] = mapped_column(String(500), nullable=False)
    recipient: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    cc: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bcc: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    subject: Mapped[str] = mapped_column(String(1000), nullable=False, default="(No Subject)")
    message_id: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, index=True)
    in_reply_to: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    references: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Status flags
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_starred: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    # Content (loaded on demand)
    plain_text_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    html_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Storage key for raw MIME EML stream
    raw_storage_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    mailbox: Mapped["Mailbox"] = relationship("Mailbox", back_populates="emails")
    user: Mapped["User"] = relationship("User", back_populates="emails")
    attachments: Mapped[List["EmailAttachment"]] = relationship(
        "EmailAttachment", back_populates="email", cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        Index("idx_emails_user_received", "user_id", "received_at"),
        Index("idx_emails_mailbox_received", "mailbox_id", "received_at"),
        Index("idx_emails_user_read", "user_id", "is_read"),
        Index("idx_emails_user_starred", "user_id", "is_starred"),
    )


class EmailAttachment(Base):
    __tablename__ = "email_attachments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False, default="application/octet-stream")
    size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    storage_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationship
    email: Mapped["Email"] = relationship("Email", back_populates="attachments")
