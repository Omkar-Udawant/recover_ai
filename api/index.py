"""Vercel serverless entrypoint for the FastAPI backend.

Vercel maps this file to the /api/index function; vercel.json rewrites all
traffic to it and FastAPI routes internally (/api/v1/*, /health, /docs).
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app  # noqa: F401  (ASGI app served by Vercel)
