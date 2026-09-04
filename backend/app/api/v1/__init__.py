from fastapi import APIRouter
from app.api.v1.agent import router as agent_router
from app.api.v1.auth import router as auth_router
from app.api.v1.bonus import router as bonus_router
from app.api.v1.cases import router as cases_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.messages import router as messages_router
from app.api.v1.payments import router as payments_router
from app.api.v1.predict import router as predict_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(cases_router)
api_router.include_router(predict_router)
api_router.include_router(agent_router)
api_router.include_router(messages_router)
api_router.include_router(payments_router)
api_router.include_router(bonus_router)

__all__ = ["api_router"]
