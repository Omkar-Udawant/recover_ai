"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  DollarSign,
  PieChart,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { KPICard } from "@/components/kpi-card";
import { RecoveryTrendChart } from "@/components/charts/recovery-trend-chart";
import { FailureReasonsChart } from "@/components/charts/failure-reasons-chart";
import { ChannelPerformanceChart } from "@/components/charts/channel-performance-chart";
import { ProbabilityDistributionChart } from "@/components/charts/probability-distribution-chart";
import { RecoveryFunnelChart } from "@/components/charts/recovery-funnel-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { BatchRunResponse, DashboardData, HonestyData, PaymentLinkItem } from "@/lib/types";

const REASON_LABELS: Record<string, string> = {
  quiet_hours: "Quiet hours",
  attempt_cap: "Attempt cap",
  cooldown: "Cooldown",
  low_expected_value: "Low value",
  already_resolved: "Resolved",
  case_not_found: "No case",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [honesty, setHonesty] = useState<HonestyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [batchLimit, setBatchLimit] = useState<number>(20);
  const [batchDry, setBatchDry] = useState<boolean>(true);
  const [batchRunning, setBatchRunning] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<BatchRunResponse | null>(null);
  const [links, setLinks] = useState<PaymentLinkItem[]>([]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, hon, pl] = await Promise.all([api.getDashboard(), api.getHonesty(), api.getPaymentLinks(8)]);
      setData(res);
      setHonesty(hon);
      setLinks(pl);
    } catch (err: any) {
      console.error("Dashboard fetch error", err);
      setError("Failed to load dashboard data from API.");
    } finally {
      setLoading(false);
    }
  };

  const runBatch = async () => {
    setBatchRunning(true);
    try {
      const res = await api.runBatch({ limit: batchLimit, tone: "friendly", respect_policy: true, dry_run: batchDry });
      setBatchResult(res);
      fetchDashboard();
    } catch (err) {
      console.error("Batch run failed", err);
    } finally {
      setBatchRunning(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Revenue Recovery Command Center
              </h1>
              <Badge variant="success" className="text-xs">
                Live Data Active
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Autonomous leakage detection, ML probability forecasting, and multi-channel recovery analytics.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboard}
              disabled={loading}
              className="border-slate-800 text-xs text-slate-300 hover:bg-slate-900"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/cases">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs shadow-md shadow-blue-600/20">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Live Agent Cases
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center h-96 space-y-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading live recovery analytics from FastAPI...</p>
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Honesty hero: net recovered, % of ceiling, attempt discipline */}
            {honesty && (
              <Card className="mb-8 border-emerald-900/40 bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-900 shadow-md">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-4">
                      <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Net recovered · honest money</span>
                      </div>
                      <div className="mt-1 text-3xl sm:text-4xl font-extrabold text-white">
                        ₹{(honesty.net_recovered_inr / 100000).toFixed(2)}L
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {honesty.pct_of_ceiling}% of achievable ceiling (₹{(honesty.ceiling_inr / 10000000).toFixed(2)}Cr) · cost ₹{honesty.cost_per_attempt_inr}/attempt
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(honesty.pct_of_ceiling, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="lg:col-span-3 flex items-center justify-start lg:justify-center space-x-2">
                      <Badge variant="success" className="text-xs">{honesty.attempts_30d} acted (30d)</Badge>
                      <Badge variant="warning" className="text-xs">{honesty.refused_30d} refused (30d)</Badge>
                    </div>
                    <div className="lg:col-span-5">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Refusals by reason — restraint is the feature
                      </div>
                      {Object.keys(honesty.refusals_by_reason).length === 0 ? (
                        <p className="text-xs text-slate-500">No refusals in the last 30 days.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(honesty.refusals_by_reason).map(([reason, count]) => (
                            <Badge key={reason} variant="outline" className="text-xs border-slate-700 text-slate-300">
                              {REASON_LABELS[reason] ?? reason}: {count}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {honesty.recent_refusals.length > 0 && (
                        <div className="mt-3 space-y-1 max-h-28 overflow-y-auto">
                          {honesty.recent_refusals.slice(0, 5).map((r, i) => (
                            <div key={`${r.case_id}-${i}`} className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <span>{r.case_id?.substring(0, 8) ?? "—"} · {REASON_LABELS[r.reason ?? ""] ?? r.reason}</span>
                              <span>{r.amount != null ? `₹${r.amount.toLocaleString("en-IN")}` : ""}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 5 KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <KPICard
                title="Revenue At Risk"
                value={`₹${(data.kpis.total_revenue_at_risk / 1000000).toFixed(2)}M`}
                subtext={`${data.kpis.total_cases_count.toLocaleString()} cases detected`}
                icon={ShieldAlert}
                variant="destructive"
              />

              <KPICard
                title="Revenue Won Back"
                value={`₹${(data.kpis.total_revenue_recovered / 1000000).toFixed(2)}M`}
                subtext={`${data.kpis.recovered_cases_count.toLocaleString()} cases recovered`}
                icon={CheckCircle2}
                variant="success"
                badge={`+${data.kpis.financial_recovery_rate_pct}%`}
              />

              <KPICard
                title="In-Flight Exposure"
                value={`₹${(data.kpis.active_in_flight_risk / 1000).toFixed(0)}k`}
                subtext={`${data.kpis.active_cases_count} active cases`}
                icon={Activity}
                variant="warning"
              />

              <KPICard
                title="AI Recovery Rate"
                value={`${data.kpis.financial_recovery_rate_pct}%`}
                subtext={`Avg Prob: ${(data.kpis.avg_recovery_probability * 100).toFixed(0)}%`}
                icon={TrendingUp}
                variant="blue"
                badge="ML Powered"
              />

              <KPICard
                title="Estimated ROI"
                value={`${data.kpis.estimated_roi_multiplier}x`}
                subtext="Net recovered / cost"
                icon={DollarSign}
                variant="default"
                badge={`${data.kpis.ai_recommendation_accuracy_pct}% Reco Acc`}
              />
            </div>

            {/* Bounded batch recovery runner */}
            <Card className="mb-8 bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-md">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-white">Bounded Batch Recovery</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Ranks open cases by expected value, applies refusal guardrails to each, acts only where it pays.
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <label className="flex items-center space-x-1.5">
                      <span className="text-slate-400">Cases</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={batchLimit}
                        onChange={(e) => setBatchLimit(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                        className="w-16 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                      />
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchDry}
                        onChange={(e) => setBatchDry(e.target.checked)}
                        className="accent-blue-600"
                      />
                      <span className="text-slate-400">Dry run</span>
                    </label>
                    <Button
                      size="sm"
                      onClick={runBatch}
                      disabled={batchRunning}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
                    >
                      <Zap className={`h-3.5 w-3.5 mr-1.5 ${batchRunning ? "animate-spin" : ""}`} />
                      {batchRunning ? "Running…" : batchDry ? "Preview batch" : "Run batch"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {batchResult && (
                <CardContent className="pt-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                    <Badge variant="outline" className="border-slate-700 text-slate-300">Considered: {batchResult.considered}</Badge>
                    <Badge variant="success">{batchDry ? "Would act" : "Acted"}: {batchResult.acted}</Badge>
                    <Badge variant="warning">Refused: {batchResult.refused}</Badge>
                    <span className="text-slate-400">
                      At risk ₹{batchResult.batch_at_risk_inr.toLocaleString("en-IN")} · Projected net ₹{batchResult.projected_net_inr.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {Object.keys(batchResult.refusals_by_reason).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(batchResult.refusals_by_reason).map(([reason, count]) => (
                        <Badge key={reason} variant="outline" className="text-[11px] border-amber-900/50 text-amber-300">
                          {REASON_LABELS[reason] ?? reason}: {count}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="max-h-44 overflow-y-auto space-y-1">
                    {batchResult.results.slice(0, 30).map((r) => (
                      <div key={r.case_id} className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/50 py-1">
                        <span>{r.case_id.substring(0, 8)} · {r.decision}{r.refusal_reason ? ` (${REASON_LABELS[r.refusal_reason] ?? r.refusal_reason})` : ""}{r.channel ? ` → ${r.channel}` : ""}</span>
                        <span>{r.expected_value_inr != null ? `EV ₹${r.expected_value_inr.toLocaleString("en-IN")}` : ""}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Live payment-link evidence */}
            <Card className="mb-8 bg-slate-900/60 border-slate-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white">Live payment links — evidence, not screenshots</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Every link the agent minted in Razorpay test mode, with its live status. Empty until test keys are configured.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 overflow-x-auto">
                {links.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No payment links yet. Add Razorpay test keys and run the agent — links appear here with Created / Paid / Cancelled / Expired statuses.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                        <th className="py-2 pr-3 font-semibold">Payment link id</th>
                        <th className="py-2 pr-3 font-semibold">Amount</th>
                        <th className="py-2 pr-3 font-semibold">Link</th>
                        <th className="py-2 pr-3 font-semibold">Status</th>
                        <th className="py-2 font-semibold">Created</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {links.map((l) => (
                        <tr key={l.link_id} className="border-b border-slate-800/50 text-slate-300">
                          <td className="py-2 pr-3 font-mono text-[11px]">{l.link_id}</td>
                          <td className="py-2 pr-3">₹{l.amount.toLocaleString("en-IN")}</td>
                          <td className="py-2 pr-3 font-mono text-[11px]">
                            {l.short_url ? (
                              <a href={l.short_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                                {l.short_url.replace("https://", "")}
                              </a>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            <Badge
                              variant={l.status === "paid" ? "success" : l.status === "cancelled" || l.status === "expired" ? "destructive" : "warning"}
                              className="text-[10px] capitalize"
                            >
                              {l.status}
                            </Badge>
                          </td>
                          <td className="py-2 text-slate-500">{l.created_at ? new Date(l.created_at).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Row 1 Charts: Trend (8 cols) & Funnel (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              <Card className="lg:col-span-8 bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base text-white">Recovery Velocity Trend (30 Days)</CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Daily comparison of recovered vs lost revenue trajectory.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[11px] border-slate-800 text-slate-300">
                      Real-Time Sync
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <RecoveryTrendChart data={data.recovery_trend} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-4 bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white">Recovery Conversion Funnel</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Step-by-step conversion from detection to recovery.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <RecoveryFunnelChart data={data.recovery_funnel} />
                </CardContent>
              </Card>
            </div>

            {/* Row 2 Charts: Failure Reasons (4 cols), Channel Performance (4 cols), Risk Distribution (4 cols) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white">Payment Failure Reasons</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Breakdown of root causes and transaction volume.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <FailureReasonsChart data={data.failure_reasons} />
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white">Channel Win Rate Performance</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Outreach effectiveness per communication channel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <ChannelPerformanceChart data={data.channel_performance} />
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white">ML Risk Tiers vs. Win Rate</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    XGBoost probability tiers and historical success.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <ProbabilityDistributionChart data={data.risk_distribution} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
