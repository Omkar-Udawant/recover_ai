"""Vercel serverless entrypoint for the FastAPI backend.

Vercel maps this file to the /api/index function; vercel.json rewrites all
traffic to it and FastAPI routes internally (/api/v1/*, /health, /docs).
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app as _fastapi_app  # noqa: F401


import json

from starlette.responses import JSONResponse

async def app(scope, receive, send):
    """ASGI entrypoint. Vercel rewrites every route to /api/index, so restore
    the original path before FastAPI routing (otherwise everything 404s)."""
    if scope.get("type") == "http":
        path = scope.get("path") or ""
        if path.rstrip("/").endswith("/__debug"):
            raw = scope.get("raw_path")
            info = {
                "path": path,
                "raw_path": raw.decode("latin-1") if isinstance(raw, (bytes, bytearray)) else raw,
                "root_path": scope.get("root_path"),
                "method": scope.get("method"),
                "query_string": (scope.get("query_string") or b"").decode("latin-1"),
                "header_keys": sorted({k.decode("latin-1") for k, _ in scope.get("headers", [])}),
            }
            await JSONResponse(info)(scope, receive, send)
            return
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
