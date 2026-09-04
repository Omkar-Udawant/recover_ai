from datetime import timedelta
from fastapi import APIRouter, HTTPException, status
from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Local-development demo login. Disabled whenever Supabase is configured
    (production path is Supabase Google OAuth -> backend JWT verification in
    app/api/deps.py) and disabled in production unless DEMO_AUTH_ENABLED=true
    with explicit DEMO_MERCHANT_EMAIL/PASSWORD. Never accepts arbitrary creds.
    """
    if settings.SUPABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password login is disabled: use Supabase Google OAuth.",
        )
    if not settings.DEMO_AUTH_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo login is disabled. Set DEMO_AUTH_ENABLED=true with DEMO_MERCHANT_EMAIL/PASSWORD for local demo only.",
        )
    if not settings.DEMO_MERCHANT_EMAIL or not settings.DEMO_MERCHANT_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Demo credentials are not configured on the server.",
        )
    if request.email.lower() != settings.DEMO_MERCHANT_EMAIL.lower() or request.password != settings.DEMO_MERCHANT_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid demo credentials.",
        )
    # Accept user login
    role = request.role if request.role in ["merchant_admin", "analyst"] else "analyst"
    
    access_token = create_access_token(
        subject=request.email,
        role=role,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user={
            "email": request.email,
            "role": role,
            "name": request.email.split("@")[0].title(),
        },
    )
