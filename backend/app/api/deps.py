from typing import Generator
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_db
from app.schemas.common import TokenPayload

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer),
) -> TokenPayload:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                    headers={"apikey": settings.SUPABASE_ANON_KEY, "Authorization": f"Bearer {credentials.credentials}"},
                )
            if response.status_code != 200:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Supabase session is invalid or expired")
            user = response.json()
            metadata = user.get("app_metadata") or {}
            role = metadata.get("role", "analyst")
            return TokenPayload(sub=user["id"], role=role, exp=0)
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Authentication provider unavailable") from exc
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        token_data = TokenPayload(
            sub=payload.get("sub", ""),
            role=payload.get("role", "analyst"),
            exp=payload.get("exp", 0),
        )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return token_data


def require_role(required_role: str):
    def role_checker(current_user: TokenPayload = Depends(get_current_user)):
        if current_user.role != required_role and current_user.role != "merchant_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for current user role",
            )
        return current_user

    return role_checker


__all__ = ["get_db", "get_current_user", "require_role"]
