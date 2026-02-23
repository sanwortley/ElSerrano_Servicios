import os
from dotenv import load_dotenv
from pydantic import model_validator
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
    GEMINI_API_KEY: str | None = None
    
    @model_validator(mode='after')
    def validate_and_transform_db_url(self) -> 'Settings':
        if not self.DATABASE_URL:
            print("CRITICAL: DATABASE_URL is empty!", flush=True)
            return self
            
        # Clean up whitespace and potential quotes (can happen in Railway/Render env vars)
        self.DATABASE_URL = self.DATABASE_URL.strip().strip('"').strip("'")
        
        # Verbose debug for Railway logs
        print(f"DEBUG: Processing DATABASE_URL (len: {len(self.DATABASE_URL)})", flush=True)
        print(f"DEBUG: Raw scheme: {self.DATABASE_URL.split('://')[0]}", flush=True)
        
        # Handle both 'postgres://' and 'postgresql://'
        # SQLAlchemy 1.4+ requires 'postgresql' and we need 'asyncpg' for our async engine
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
        elif self.DATABASE_URL.startswith("postgresql://") and "asyncpg" not in self.DATABASE_URL:
            self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        print(f"DEBUG: Final scheme: {self.DATABASE_URL.split('://')[0]}", flush=True)
        return self

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
