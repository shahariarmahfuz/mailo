from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine
from app.models import Base

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Mailo Application Foundation...")
    # Create tables if not exist (ensures instant plug-and-play with PostgreSQL)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified successfully.")
    except Exception as e:
        logger.warning(
            f"Could not initialize database on startup (will connect when DATABASE_URL is available): {e}"
        )
    yield
    await engine.dispose()
    logger.info("Mailo Application shutdown complete.")


app = FastAPI(
    title="Mailo — Incoming Email API",
    description="Backend API for Mailo incoming-email system powered by Cloudflare Email Worker",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check
@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Mailo Backend API",
        "version": "1.0.0",
    }


# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
