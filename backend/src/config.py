import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    
    NOMINATIM_USER_AGENT: str = "volquetes-gestion-app"
    
    def model_post_init(self, __context) -> None:
        if self.DATABASE_URL and "asyncpg" not in self.DATABASE_URL:
            # Force asyncpg driver even if env var is sync
            self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
