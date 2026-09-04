from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    status: str = "ok"

    model_config = ConfigDict(extra="forbid")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    role: str = "analyst"
    exp: int
