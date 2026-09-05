from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from app.core.config import settings

# Serverless (production) runs behind a transaction pooler (e.g. Supabase
# :6543): no persistent pool, no prepared-statement cache. Local dev keeps
# the default pool for throughput.
_is_prod = settings.ENVIRONMENT == "production"

# Configure async engine
engine_kwargs: dict = {
    "echo": (settings.ENVIRONMENT == "development" and settings.LOG_LEVEL == "DEBUG"),
    "future": True,
    "pool_pre_ping": True,
}
if _is_prod:
    engine_kwargs["poolclass"] = NullPool
    engine_kwargs["connect_args"] = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

# Async session factory
async_session = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
