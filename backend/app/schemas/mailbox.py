from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class MailboxCreate(BaseModel):
    address: EmailStr
    name: str = Field(default="My Mailbox", max_length=100)
    is_primary: bool = False


class MailboxUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None


class MailboxResponse(BaseModel):
    id: str
    user_id: str
    address: str
    name: str
    is_primary: bool
    is_active: bool
    created_at: datetime
    email_count: int = 0
    unread_count: int = 0

    class Config:
        from_attributes = True
