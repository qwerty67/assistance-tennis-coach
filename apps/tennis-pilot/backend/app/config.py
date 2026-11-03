from pydantic_settings import BaseSettings,SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # App
    APP_NAME: str = "TennisPilot"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./tennis.db"

    # Gemini AI
    GEMINI_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: str | None = None
    QWEN_ARVANCLOUD_API_KEY: str | None = None
    QWEN_ARVANCLOUD_GATEWAY: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()