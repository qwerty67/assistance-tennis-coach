"""Application configuration loaded from environment variables / .env file."""
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Tennis Coach Platform API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # DATABASE_URL: str = "postgresql+psycopg2://tennis:tennis@localhost:5432/tennis_coach"
    DATABASE_URL: str = "sqlite:///./tennis_coach.db"
    AUTO_CREATE_TABLES: bool = False  # use Alembic in production

    JWT_SECRET: str = "CHANGE_ME_IN_PRODUCTION_please_use_a_long_random_string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
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
