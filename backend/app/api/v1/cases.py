from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.schemas.cases import CaseDetailResponse, CaseListResponse
from app.schemas.common import TokenPayload
from app.services.case_service import CaseService

router = APIRouter(prefix="/cases", tags=["Recovery Cases"])


@router.get("", response_model=CaseListResponse)
async def list_cases(
    status: Optional[str] = Query(None, description="Filter by case status: pending, contacted, link_opened, payment_attempted, recovered, lost"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level: low, medium, high"),
    channel: Optional[str] = Query(None, description="Filter by channel: email, whatsapp, sms, voice_call"),
    search: Optional[str] = Query(None, description="Search by customer name or email"),
    min_amount: Optional[float] = Query(None, description="Minimum transaction amount"),
    max_amount: Optional[float] = Query(None, description="Maximum transaction amount"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Sort field: created_at, amount, recovery_probability"),
    sort_order: str = Query("desc", description="Sort direction: asc or desc"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Retrieve paginated recovery cases with optional multi-attribute filtering and customer details.
    """
    return await CaseService.list_cases(
        db=db,
        status=status,
        risk_level=risk_level,
        channel=channel,
        search=search,
        min_amount=min_amount,
        max_amount=max_amount,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/{id}", response_model=CaseDetailResponse)
async def get_case_detail(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Retrieve complete detail for a recovery case including customer profile,
    payment information, action history timeline, ML predictions, and audit trail.
    """
    case_detail = await CaseService.get_case_detail(db, id)
    if not case_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recovery case with ID '{id}' was not found.",
        )
    return case_detail
