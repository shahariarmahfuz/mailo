from typing import Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repo import UserRepository
from app.repositories.mailbox_repo import MailboxRepository
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import SignupRequest, LoginRequest
from app.models.user import User


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.mailbox_repo = MailboxRepository(db)

    async def signup(self, data: SignupRequest) -> Tuple[User, str]:
        existing_user = await self.user_repo.get_by_email(data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this login email already exists.",
            )

        hashed_pw = hash_password(data.password)
        user = await self.user_repo.create(
            email=data.email,
            hashed_password=hashed_pw,
            name=data.name,
        )

        # Automatically create initial default mailbox using login email or custom name
        initial_address = data.email.lower().strip()
        existing_mb = await self.mailbox_repo.get_by_address(initial_address)
        if not existing_mb:
            await self.mailbox_repo.create(
                user_id=user.id,
                address=initial_address,
                name=data.initial_mailbox_name or "Main Mailbox",
                is_primary=True,
            )

        await self.db.commit()
        await self.db.refresh(user)

        token = create_access_token(user.id)
        return user, token

    async def login(self, data: LoginRequest) -> Tuple[User, str]:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid login credentials.",
            )

        token = create_access_token(user.id)
        return user, token
