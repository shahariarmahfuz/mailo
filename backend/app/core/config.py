import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Mailo"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://neondb_owner:npg_SP4WOg6GJVHf@ep-soft-meadow-b3dknfac-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?ssl=require",
    )

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "mailo_default_secret_key_change_in_production_99881122")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Internal API Secret for Worker (optional, can be empty)
    INTERNAL_API_KEY: str = os.getenv("INTERNAL_API_KEY", "")

    # Storage
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "storage/emails")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost:3000",
    ]

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL.strip()
        # Normalization for SQLAlchemy asyncpg
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        # asyncpg prefers ssl=require over sslmode=require & channel_binding
        if "sslmode=require" in url:
            url = url.replace("sslmode=require", "ssl=require")
        if "&channel_binding=require" in url:
            url = url.replace("&channel_binding=require", "")
        if "?channel_binding=require&" in url:
            url = url.replace("channel_binding=require&", "")
        if "?channel_binding=require" in url:
            url = url.replace("?channel_binding=require", "")
            
        return url

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"


settings = Settings()
