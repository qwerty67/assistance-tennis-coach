"""Application configuration loaded from environment variables / .env file."""
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_WORKSPACE_ROOT = Path(__file__).resolve().parents[4]
_DEFAULT_DB_FILE = _WORKSPACE_ROOT / "platform-core" / "database" / "tennis_platform.db"
_DEFAULT_SQLITE_URL = f"sqlite:///{_DEFAULT_DB_FILE.as_posix()}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Tennis Coach Platform API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # Default points to centralized platform-core database, overridable by .env
    DATABASE_URL: str = _DEFAULT_SQLITE_URL
    AUTO_CREATE_TABLES: bool = False  # use Alembic in production

    JWT_SECRET: str = "CHANGE_ME_IN_PRODUCTION_please_use_a_long_random_string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    CORS_ORIGINS: list[str] = ["*"]

    DEFAULT_TIMEZONE: str = "Asia/Tehran"
    DEFAULT_CURRENCY: str = "IRT"  # Toman

    RATE_LIMIT_AUTH_PER_MINUTE: int = 10
    RATE_LIMIT_ENABLED: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
