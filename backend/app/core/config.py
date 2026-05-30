import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_env = os.getenv("APP_ENV", "dev")
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / f".env.{_env}"


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
