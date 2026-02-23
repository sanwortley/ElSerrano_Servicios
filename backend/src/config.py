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
    
    @model_validator(mode='before')
    @classmethod
    def pre_validate_settings(cls, data: dict) -> dict:
        if isinstance(data, dict):
            db_url = data.get("DATABASE_URL")
            if db_url and isinstance(db_url, str):
                # Clean up if the user pasted "DATABASE_URL=..." into the value field
                if "DATABASE_URL=" in db_url:
                    db_url = db_url.split("DATABASE_URL=")[-1]
                
                # Extreme cleaning
                db_url = db_url.strip().strip('"').strip("'").strip()
                
                # Force async driver
                if db_url.startswith("postgres://"):
                    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
                elif db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
                    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
                
                data["DATABASE_URL"] = db_url
                print(f"INFO: Database URL cleaned and driver forced.", flush=True)
        return data

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
