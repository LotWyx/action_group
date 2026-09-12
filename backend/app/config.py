from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://app:app@localhost:5432/performance_review"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24 * 7

    cors_origins: str = "http://localhost:5173,http://localhost:8080"

    # VK community (group) bot integration (https://dev.vk.com/ru/method/messages.send).
    # Optional: notifications are silently skipped when no token is configured.
    vk_bot_token: str = ""
    vk_api_version: str = "5.199"
    vk_reminder_days_ahead: int = 3
    vk_reminder_check_interval_hours: int = 24

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

    # Local speech-to-text for the "meeting notes from audio" feature
    # (faster-whisper, CPU-only int8). "tiny" is the deliberate choice here —
    # the target server has 2GB RAM total, shared with Postgres and the app
    # itself, so a bigger model isn't an option.
    whisper_model_size: str = "tiny"
    whisper_language: str = "ru"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
