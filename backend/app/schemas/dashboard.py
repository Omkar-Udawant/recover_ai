from typing import List, Optional
from pydantic import BaseModel


class DashboardKPIs(BaseModel):
    total_revenue_at_risk: float
    total_revenue_recovered: float
    total_revenue_lost: float
    active_in_flight_risk: float
    financial_recovery_rate_pct: float
    total_cases_count: int
    active_cases_count: int
    recovered_cases_count: int
    lost_cases_count: int
    case_recovery_rate_pct: float
    avg_recovery_probability: float
    estimated_roi_multiplier: float
    avg_churn_risk: float = 0.0
    revenue_recovered_today: float = 0.0
    ai_recommendation_accuracy_pct: float = 0.0


class TrendDataPoint(BaseModel):
    date: str
    recovered_amount: float
    lost_amount: float
    at_risk_amount: float


class FailureReasonItem(BaseModel):
    reason: str
    count: int
    amount: float
    percentage: float


class ChannelPerformanceItem(BaseModel):
    channel: str
    total_cases: int
    recovered_cases: int
    win_rate_pct: float
    recovered_amount: float


class RiskDistributionItem(BaseModel):
    risk_level: str
    count: int
    avg_probability: float
    recovery_rate_pct: float


class FunnelStageItem(BaseModel):
    stage: str
    count: int
    percentage: float


class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    recovery_trend: List[TrendDataPoint]
    failure_reasons: List[FailureReasonItem]
    channel_performance: List[ChannelPerformanceItem]
    risk_distribution: List[RiskDistributionItem]
    recovery_funnel: List[FunnelStageItem]
