"""Pytest Test Configuration and Async Fixtures."""

import os
import tempfile
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base, get_db
from app.main import app
from app.seed.loader import seed_scenario


@pytest_asyncio.fixture(scope="function")
async def test_session():
    """Provides an isolated SQLite database session for each test function."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = os.path.join(tmpdir, "test.db").replace("\\", "/")
        test_db_url = f"sqlite+aiosqlite:///{db_path}"
        engine = create_async_engine(test_db_url, echo=False)
        async_session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with async_session_factory() as session:
            # Seed default nominal scenario
            await seed_scenario(session, "nominal_iss_baseline", "astro-101")
            yield session

        await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(test_session: AsyncSession):
    """Provides an AsyncClient connected to the FastAPI app with the test database session overridden."""
    async def override_get_db():
        yield test_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()

