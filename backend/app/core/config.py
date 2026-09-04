import json
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "RecoverAI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/recoverai"

    # Security
    JWT_SECRET: str = "super_secret_jwt_recovery_ai_hackathon_token_key_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    DEMO_AUTH_ENABLED: bool = False
    DEMO_MERCHANT_EMAIL: str = ""
    DEMO_MERCHANT_PASSWORD: str = ""

    # Policy guardrails (Wapsi-style refusal engine): the agent must refuse
    # to act when outreach is wasteful, duplicative, or non-compliant.
    POLICY_MAX_ATTEMPTS_PER_CASE_30D: int = 3
    POLICY_COOLDOWN_HOURS: int = 24
    # Expected-value gate: p × amount × margin − cost ≥ floor.
    # Margin, not gross: recovering a rupee is worth its contribution margin.
    POLICY_CONTRIBUTION_MARGIN: float = 0.4
    POLICY_COST_PER_ATTEMPT_INR: float = 1.5
    POLICY_FLOOR_INR: float = 45.0
    POLICY_QUIET_HOURS_ENFORCE: bool = True
    POLICY_QUIET_START_HOUR_IST: int = 21
    POLICY_QUIET_END_HOUR_IST: int = 9
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # AI / LLM Integrations
    GEMINI_API_KEY: str = ""

    # Outbound email (SMTP — Gmail App Password for the demo)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM_NAME: str = "RecoverAI"

    # Payment Gateway Integrations
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    RATE_LIMIT_PER_MINUTE: int = 120

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        # Managed hosts (Render/Railway) provide postgres:// or postgresql://;
        # this service needs the asyncpg driver.
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return "postgresql+asyncpg://" + v[len("postgres://"):]
            if v.startswith("postgresql://"):
                return "postgresql+asyncpg://" + v[len("postgresql://"):]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
