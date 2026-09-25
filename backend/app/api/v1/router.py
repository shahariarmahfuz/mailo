from fastapi import APIRouter
from app.api.v1 import auth, mailboxes, emails
from app.api.internal import incoming

api_router = APIRouter()

# Public & User APIs
api_router.include_router(auth.router)
api_router.include_router(mailboxes.router)
api_router.include_router(emails.router)

# Internal Worker API
api_router.include_router(incoming.router)
