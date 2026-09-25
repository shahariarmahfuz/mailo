from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
