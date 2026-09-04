from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from collections import defaultdict, deque
from time import monotonic
from app.api.v1 import api_router
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.schemas.common import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    setup_logging()
    logger.info(f"Starting {settings.PROJECT_NAME} in {settings.ENVIRONMENT} mode...")
    yield
    # Shutdown tasks
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Autonomous AI Revenue Recovery Agent Platform Backend",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

_rate_windows: dict[str, deque[float]] = defaultdict(deque)

@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if request.url.path in {"/health", "/docs", "/openapi.json"}:
        return await call_next(request)
    client = request.client.host if request.client else "unknown"
    now = monotonic()
    window = _rate_windows[client]
    while window and window[0] <= now - 60:
        window.popleft()
    if len(window) >= settings.RATE_LIMIT_PER_MINUTE:
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"}, headers={"Retry-After": "60"})
    window.append(now)
    return await call_next(request)

# CORS middleware configuration (explicit allow-list; no wildcard methods/headers)
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Requested-With", "X-Razorpay-Signature"],
        max_age=600,
    )

# Include v1 API routes (/api/v1/auth, /api/v1/dashboard, /api/v1/cases)
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint returning application status.
    """
    return HealthResponse(status="ok")


@app.get("/", tags=["Root"])
async def root():
    """
    Root landing response pointing to API documentation.
    """
    return {
        "name": settings.PROJECT_NAME,
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
        "api_v1": f"{settings.API_V1_STR}",
    }
