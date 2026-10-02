import os
from pathlib import Path
from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Locate .env file: check backend/.env first, then root .env
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BACKEND_DIR.parent
ENV_PATH = BACKEND_DIR / ".env" if (BACKEND_DIR / ".env").exists() else ROOT_DIR / ".env"


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    Secrets are kept server-side and never exposed.
    """
    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "AI Inventory Decision Engine"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Supabase Configuration
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_PUBLISHABLE_KEY: str = Field("", description="Supabase publishable anon key")
    SUPABASE_PUBLISHABLe_KEY: Optional[str] = Field(None, description="Fallback key with typo")
    SUPABASE_SECRET_KEY: str = Field(..., description="Supabase secret service key (server-only)")

    # Gemini Configuration
    GEMINI_API_KEY: str = Field(..., description="Google Gemini API key for AI Copilot (server-only)")

    # Data paths: Use /tmp in production (Render's ephemeral filesystem)
    @property
    def _data_base(self) -> Path:
        if self.ENVIRONMENT == "production":
            return Path("/tmp")
        return ROOT_DIR

    @property
    def DATA_RAW_DIR(self) -> Path:
        return self._data_base / "data" / "raw"

    @property
    def DATA_PROCESSED_DIR(self) -> Path:
        return self._data_base / "data" / "processed"

    @property
    def DATA_SAMPLE_DIR(self) -> Path:
        return self._data_base / "data" / "sample"

    @property
    def DATA_ARTIFACTS_DIR(self) -> Path:
        return self._data_base / "data" / "artifacts"

    @property
    def MODELS_DIR(self) -> Path:
        return self._data_base / "ml" / "models"

    @field_validator("SUPABASE_PUBLISHABLE_KEY", mode="before")
    @classmethod
    def resolve_publishable_key(cls, v, info):
        # Resolve from SUPABASE_PUBLISHABLe_KEY if empty or lower-case typo present
        if not v:
            data = info.data if hasattr(info, "data") else {}
            alt = data.get("SUPABASE_PUBLISHABLe_KEY") or os.environ.get("SUPABASE_PUBLISHABLe_KEY")
            if alt:
                return alt
        return v or ""

    @property
    def anon_key(self) -> str:
        return self.SUPABASE_PUBLISHABLE_KEY or self.SUPABASE_PUBLISHABLe_KEY or ""


# Instantiate settings with informative error handling
try:
    settings = Settings()
except Exception as exc:
    # Fail clearly during startup if required variables are missing, without exposing secret values
    missing = []
    env_content = os.environ
    for req in ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "GEMINI_API_KEY"]:
        if not env_content.get(req) and not (ENV_PATH.exists() and req in ENV_PATH.read_text()):
            missing.append(req)
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}. Please set them in .env") from exc
    raise exc
