import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context
import sys
import os

# Add backend directory to sys.path to allow importing src
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Import Base to get metadata
from src.db import Base
from src.models import users, geo, business # Register models
from src.config import settings

config = context.config

# Overwrite verify url from settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# if config.config_file_name is not None:
#     fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

from sqlalchemy import create_engine

def run_migrations_online() -> None:
    # Use sync driver for migrations to avoid asyncpg/windows loop issues
    # Replace +asyncpg with +psycopg2 or nothing (default)
    # The URL in .env is postgresql+asyncpg://...
    # We change it to postgresql://... which implies psycopg2
    
    url = settings.DATABASE_URL.replace("+asyncpg", "")
    
    connectable = create_engine(
        url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    # No need for asyncio.run anymore
    run_migrations_online()
