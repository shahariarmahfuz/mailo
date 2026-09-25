from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        normalized = email.lower().strip()
        result = await self.db.execute(select(User).where(User.email == normalized))
        return result.scalars().first()

    async def create(self, email: str, hashed_password: str, name: str) -> User:
        user = User(
            email=email.lower().strip(),
            hashed_password=hashed_password,
            name=name.strip(),
        )
        self.db.add(user)
        await self.db.flush()
        return user
