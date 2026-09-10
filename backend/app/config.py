from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://app:app@localhost:5432/performance_review"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24 * 7

    cors_origins: str = "http://localhost:5173,http://localhost:8080"

    # MAX messenger bot integration (https://dev.max.ru). Optional: notifications
    # are silently skipped when no token is configured.
    max_bot_token: str = ""
    max_api_base_url: str = "https://platform-api2.max.ru"
    max_reminder_days_ahead: int = 3
    max_reminder_check_interval_hours: int = 24

    # GigaChat (Sber) — free-tier Russian LLM used for the employee/department
    # AI-analysis feature. Optional: endpoints report a clear error when no
    # key is configured, nothing else in the app depends on it.
    gigachat_auth_key: str = ""
    gigachat_scope: str = "GIGACHAT_API_PERS"
    gigachat_model: str = "GigaChat"
    # Sber's endpoints use a Russian national root CA ("Минцифры России") that
    # most systems don't trust out of the box; verification is off by default
    # so the integration works without extra setup. Set to true once that CA
    # is installed in the container's trust store.
    gigachat_verify_ssl: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
