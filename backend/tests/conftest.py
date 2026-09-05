import pytest
from app.core.config import settings

@pytest.fixture(autouse=True)
def setup_test_settings(monkeypatch):
    monkeypatch.setattr(settings, 'DEMO_AUTH_ENABLED', True)
    monkeypatch.setattr(settings, 'DEMO_MERCHANT_EMAIL', 'admin@recoverai.com')
    monkeypatch.setattr(settings, 'DEMO_MERCHANT_PASSWORD', 'password123')