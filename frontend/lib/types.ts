export interface TrendDataPoint {
  date: string;
  recovered_amount: number;
  lost_amount: number;
  at_risk_amount: number;
}

export interface FailureReasonItem {
  reason: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface ChannelPerformanceItem {
  channel: string;
  total_cases: number;
  recovered_cases: number;
  win_rate_pct: number;
  recovered_amount: number;
}

export interface RiskDistributionItem {
  risk_level: string;
  count: number;
  avg_probability: number;
  recovery_rate_pct: number;
}

export interface FunnelStageItem {
  stage: string;
  count: number;
  percentage: number;
}

export interface DashboardKPIs {
  total_revenue_at_risk: number;
  total_revenue_recovered: number;
  total_revenue_lost: number;
  active_in_flight_risk: number;
  financial_recovery_rate_pct: number;
  total_cases_count: number;
  active_cases_count: number;
  recovered_cases_count: number;
  lost_cases_count: number;
  case_recovery_rate_pct: number;
  avg_recovery_probability: number;
  estimated_roi_multiplier: number;
  avg_churn_risk?: number;
  revenue_recovered_today?: number;
  ai_recommendation_accuracy_pct?: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  recovery_trend: TrendDataPoint[];
  failure_reasons: FailureReasonItem[];
  channel_performance: ChannelPerformanceItem[];
  risk_distribution: RiskDistributionItem[];
  recovery_funnel: FunnelStageItem[];
}

export interface HonestyData {
  net_recovered_inr: number;
  recovered_inr: number;
  ceiling_inr: number;
  pct_of_ceiling: number;
  attempts_30d: number;
  refused_30d: number;
  refusals_by_reason: Record<string, number>;
  recent_refusals: Array<{
    case_id?: string | null;
    reason?: string | null;
    at?: string | null;
    amount?: number | null;
  }>;
  cost_per_attempt_inr: number;
}

export interface PaymentLinkItem {
  link_id: string;
  short_url?: string;
  order_id?: string;
  case_id?: string;
  amount: number;
  currency: string;
  status: string;
  reference?: string;
  created_at?: string;
}

export interface PolicyData {
  gate: string;
  contribution_margin: number;
  cost_per_attempt_inr: number;
  floor_inr: number;
  max_attempts_per_case_30d: number;
  cooldown_hours: number;
  quiet_hours_enforce: boolean;
  quiet_window_ist: string;
  rules: string[];
}

export interface CaseListItem {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  payment_id?: string;
  amount: number;
  currency: string;
  status: string;
  risk_level?: string;
  recovery_probability?: number;
  assigned_channel?: string;
  failure_reason?: string;
  event_type?: string;
  days_overdue: number;
  created_at: string;
  recovered_at?: string;
}

export interface CaseListResponse {
  items: CaseListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tenure_days: number;
  engagement_score: number;
  previous_successful_recoveries: number;
}

export interface PaymentSummary {
  id: string;
  amount: number;
  currency: string;
  status: string;
  failure_reason?: string;
  event_type: string;
  days_overdue: number;
  created_at: string;
}

export interface RecoveryActionItem {
  id: string;
  channel?: string;
  message_content?: string;
  payment_link?: string;
  action_status?: string;
  template?: string;
  lang?: string;
  cost_paise?: number;
  created_at: string;
}

export interface PredictionItem {
  id: string;
  model_version?: string;
  features?: Record<string, any>;
  predicted_probability?: number;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor?: string;
  action?: string;
  entity_type?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CaseDetailResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  risk_level?: string;
  recovery_probability?: number;
  assigned_channel?: string;
  created_at: string;
  recovered_at?: string;
  customer?: CustomerSummary;
  payment?: PaymentSummary;
  actions: RecoveryActionItem[];
  predictions: PredictionItem[];
  audit_logs: AuditLogItem[];
  intelligence: Record<string, any>;
}

export interface AgentRunResponse {
  case_id: string;
  payment_id: string;
  risk_level: string;
  recovery_probability: number;
  channel: string;
  channel_reason: string;
  message: string;
  payment_link: string;
  case_status: string;
  decision?: string;
  refusal_reason?: string | null;
}

export interface BatchCaseResult {
  case_id: string;
  decision: string;
  refusal_reason?: string;
  risk_level?: string;
  channel?: string;
  expected_value_inr?: number;
}

export interface BatchRunResponse {
  considered: number;
  acted: number;
  refused: number;
  refusals_by_reason: Record<string, number>;
  batch_at_risk_inr: number;
  projected_net_inr: number;
  results: BatchCaseResult[];
}
