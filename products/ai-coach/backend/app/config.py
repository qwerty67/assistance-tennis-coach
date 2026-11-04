from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

_WORKSPACE_ROOT = Path(__file__).resolve().parents[4]
_DEFAULT_DB_FILE = _WORKSPACE_ROOT / "platform-core" / "database" / "tennis_platform.db"
_DEFAULT_SQLITE_URL = f"sqlite:///{_DEFAULT_DB_FILE.as_posix()}"


class Settings(BaseSettings):
    """Application settings synchronized with platform-core"""

    # App
    APP_NAME: str = "TennisPilot"
    DEBUG: bool = True

    # Database: synced with platform-core centralized database
    DATABASE_URL: str = _DEFAULT_SQLITE_URL

    # JWT Settings (synced with platform-core & coach-assistant)
    JWT_SECRET: str = "tennis-platform-shared-secret-key-2026-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    # Gemini AI
    GEMINI_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: str | None = None
    QWEN_ARVANCLOUD_API_KEY: str | None = None
    QWEN_ARVANCLOUD_GATEWAY: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
