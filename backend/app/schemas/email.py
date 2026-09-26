from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class AttachmentResponse(BaseModel):
    id: str
    filename: str
    content_type: str
    size_bytes: int

    class Config:
        from_attributes = True


class EmailSummaryResponse(BaseModel):
    id: str
    mailbox_id: str
    mailbox_address: str
    sender: str
    recipient: str
    subject: str
    received_at: datetime
    is_read: bool
    is_starred: bool
    size_bytes: int
    has_attachments: bool
    preview: Optional[str] = None

    class Config:
        from_attributes = True


class EmailDetailResponse(BaseModel):
    id: str
    mailbox_id: str
    mailbox_address: str
    sender: str
    recipient: str
    cc: Optional[str] = None
    bcc: Optional[str] = None
    subject: str
    message_id: Optional[str] = None
    in_reply_to: Optional[str] = None
    references: Optional[str] = None
    received_at: datetime
    is_read: bool
    is_starred: bool
    size_bytes: int
    plain_text_body: Optional[str] = None
    html_body: Optional[str] = None
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True


class EmailListResponse(BaseModel):
    items: List[EmailSummaryResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class EmailUpdateStatus(BaseModel):
    is_read: Optional[bool] = None
    is_starred: Optional[bool] = None
