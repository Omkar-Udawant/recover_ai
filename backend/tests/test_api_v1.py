import pytest
from httpx import ASGITransport, AsyncClient
from app.core.security import create_access_token
from app.main import app


@pytest.mark.asyncio
async def test_auth_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@recoverai.com", "password": "password123", "role": "merchant_admin"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["role"] == "merchant_admin"


@pytest.mark.asyncio
async def test_dashboard_unauthorized():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_cases_unauthorized():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/cases")
        assert response.status_code == 401
