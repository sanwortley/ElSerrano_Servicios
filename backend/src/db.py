from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from src.config import settings

# Debug log for SQLAlchemy URL parsing issue
url_parts = settings.DATABASE_URL.split("@")
masked_url = f"{url_parts[0].split('://')[0]}://***@{url_parts[-1]}" if len(url_parts) > 1 else "INVALID_URL_FORMAT"
print(f"INFO: Creating engine with URL: {masked_url}", flush=True)

try:
    engine = create_async_engine(
        settings.DATABASE_URL, 
        echo=False,
        connect_args={"ssl": False}
    )
except Exception as e:
    print(f"CRITICAL: Failed to create engine. URL was: {masked_url}", flush=True)
    raise e

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
