"""Vercel serverless entrypoint for the FastAPI backend.

Vercel maps this file to the /api/index function; vercel.json rewrites all
traffic to it and FastAPI routes internally (/api/v1/*, /health, /docs).
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app as _fastapi_app  # noqa: F401


async def app(scope, receive, send):
    """ASGI entrypoint. Vercel rewrites every route to /api/index, so restore
    the original path before FastAPI routing (otherwise everything 404s)."""
    if scope.get("type") == "http":
        path = scope.get("path") or ""
        if path == "/api/index":
            scope["path"] = "/"
            scope["raw_path"] = b"/"
        elif path.startswith("/api/index/"):
            new_path = path[len("/api/index"):] or "/"
            scope["path"] = new_path
            try:
                scope["raw_path"] = new_path.encode("latin-1")
            except Exception:
                pass
    await _fastapi_app(scope, receive, send)
