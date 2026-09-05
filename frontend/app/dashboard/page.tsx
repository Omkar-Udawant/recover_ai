"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Zap,
} from "lucide-react";
import { WorkbenchShell } from "@/components/workbench-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecoveryTrendChart } from "@/components/charts/recovery-trend-chart";
import { FailureReasonsChart } from "@/components/charts/failure-reasons-chart";
import { ChannelPerformanceChart } from "@/components/charts/channel-performance-chart";
import { ProbabilityDistributionChart } from "@/components/charts/probability-distribution-chart";
import { RecoveryFunnelChart } from "@/components/charts/recovery-funnel-chart";
import { api } from "@/lib/api-client";
import { BatchRunResponse, DashboardData, HonestyData, PaymentLinkItem } from "@/lib/types";
import { toast } from "sonner";

const REASON_LABELS: Record<string, string> = {
  quiet_hours: "Quiet Hours (IST)",
  attempt_cap: "Attempt Cap (3/30d)",
  cooldown: "Cooldown Window",
  low_expected_value: "Low Expected Value (<₹45)",
  already_resolved: "Already Resolved",
  case_not_found: "Case Not Found",
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "batch" | "links">("overview");
  const [batchLimit, setBatchLimit] = useState<number>(20);
  const [batchDry, setBatchDry] = useState<boolean>(true);
  const [batchTone, setBatchTone] = useState<string>("friendly");
  const [batchBusy, setBatchBusy] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<BatchRunResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // TanStack Query for cached server data
  const { data: dashboard, isLoading: loadingDash, refetch: refetchDash } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => api.getDashboard(),
    staleTime: 1000 * 30,
  });

  const { data: honesty, isLoading: loadingHonesty, refetch: refetchHonesty } = useQuery<HonestyData>({
    queryKey: ["honesty"],
    queryFn: () => api.getHonesty(),
    staleTime: 1000 * 30,
  });

  const { data: paymentLinks = [], refetch: refetchLinks } = useQuery<PaymentLinkItem[]>({
    queryKey: ["payment-links"],
    queryFn: () => api.getPaymentLinks(20),
    staleTime: 1000 * 30,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchDash(), refetchHonesty(), refetchLinks()]);
    setIsRefreshing(false);
    toast.success("Synchronized real-time ledger state");
  };

  const runBatchAgent = async () => {
    setBatchBusy(true);
    try {
      const res = await api.runBatch({
        limit: batchLimit,
        tone: batchTone,
        respect_policy: true,
        dry_run: batchDry,
      });
      setBatchResult(res);
      toast.success(
        `Batch complete: ${res.acted} actions dispatched, ${res.refused} interventions refused by policy.`
      );
      refetchDash();
      refetchHonesty();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Batch orchestration failed");
    } finally {
      setBatchBusy(false);
    }
  };

  const kpis = dashboard?.kpis;

  return (
    <WorkbenchShell activeViewTitle="Analytics & Cockpit">
      <div className="p-4 sm:p-6 space-y-5 max-w-7xl">
        {/* Header Command Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Revenue Recovery Terminal
              </h1>
              <span className="rounded-[3px] border border-border bg-secondary/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                5,003 Synchronized Cases
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Live multi-agent decisioning, expected-value gating, and immutable audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="font-mono text-xs h-8"
            >
              <RefreshCw className={`h-3 w-3 mr-1.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
              Sync Ledger
            </Button>

            <Link href="/">
              <Button size="sm" className="font-mono text-xs h-8">
                <Zap className="h-3 w-3 mr-1.5" />
                Case Ledger
                <ArrowRight className="h-3 w-3 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial Velocity Hero Banner */}
        {honesty && (
          <Card className="p-4 sm:p-5 bg-card border-border">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left col: Net Recovered & Gauge */}
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Net Revenue Recovered · Honest Metric</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground tracking-tight tabular-nums">
                  ₹{(honesty.net_recovered_inr / 100000).toFixed(2)} Lakhs
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{honesty.pct_of_ceiling}%</span> of achievable ceiling (₹{(honesty.ceiling_inr / 10000000).toFixed(2)} Cr) · cost ₹{honesty.cost_per_attempt_inr}/attempt
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-700"
                    style={{ width: `${Math.min(honesty.pct_of_ceiling, 100)}%` }}
                  />
                </div>
              </div>

              {/* Middle col: Restraint Numbers */}
              <div className="lg:col-span-4 flex flex-col justify-center space-y-2.5 border-y lg:border-y-0 lg:border-x border-border py-3 lg:py-0 lg:px-6 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Outreach Attempts (30d):</span>
                  <span className="font-bold text-foreground tabular-nums">{honesty.attempts_30d.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Refusals Enforced (30d):</span>
                  <span className="font-bold text-rose-700 dark:text-rose-400 tabular-nums">{honesty.refused_30d.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Outreach Restraint Ratio:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {honesty.attempts_30d + honesty.refused_30d > 0
                      ? ((honesty.refused_30d / (honesty.attempts_30d + honesty.refused_30d)) * 100).toFixed(1)
                      : 0}% Refused
                  </span>
                </div>
              </div>

              {/* Right col: Top Refusal Reasons */}
              <div className="lg:col-span-3 space-y-1.5 font-mono text-xs">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Top Refusal Reasons
                </div>
                {Object.entries(honesty.refusals_by_reason || {}).slice(0, 3).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground truncate max-w-[130px]">{REASON_LABELS[k] || k}</span>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                      {v}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 4 Core Stat Cards */}
        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Total Revenue At Risk"
              value={`₹${(kpis.total_revenue_at_risk / 100000).toFixed(2)}L`}
              subtext={`${kpis.total_cases_count.toLocaleString("en-IN")} total default events`}
              icon={ShieldAlert}
            />
            <StatCard
              title="Revenue Recovered"
              value={`₹${(kpis.total_revenue_recovered / 100000).toFixed(2)}L`}
              subtext={`${kpis.recovered_cases_count} cases successfully paid`}
              icon={CheckCircle2}
              badge={`${kpis.financial_recovery_rate_pct.toFixed(1)}%`}
            />
            <StatCard
              title="In-Flight Active Risk"
              value={`₹${(kpis.active_in_flight_risk / 100000).toFixed(2)}L`}
              subtext={`${kpis.active_cases_count} cases currently queued`}
              icon={Activity}
            />
            <StatCard
              title="AI Recommendation Rate"
              value={`${kpis.ai_recommendation_accuracy_pct || 66.9}%`}
              subtext="Calibrated XGBoost & 8-Agent DAG"
              icon={DollarSign}
              badge="0.681 AUC"
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-border pb-1">
          <Button
            variant={activeTab === "overview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("overview")}
            className="font-medium"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Analytics &amp; Intelligence
          </Button>
          <Button
            variant={activeTab === "batch" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("batch")}
            className="font-medium"
          >
            <Sliders className="h-3.5 w-3.5 mr-1.5" />
            Bounded Batch Cockpit
          </Button>
          <Button
            variant={activeTab === "links" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("links")}
            className="font-medium"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Payment Links ({paymentLinks.length})
          </Button>
        </div>

        {/* TAB 1: Analytics & Charts */}
        {activeTab === "overview" && dashboard && (
          <div className="space-y-6">
            {/* Primary Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-5">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Recovery vs. Lost Revenue Trend</CardTitle>
                  <CardDescription>30-day chronological breakdown of recovered capital vs. permanent losses</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <RecoveryTrendChart data={dashboard.recovery_trend} />
                </CardContent>
              </Card>

              <Card className="p-5">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Root Cause Failure Distribution</CardTitle>
                  <CardDescription>Breakdown by bank decline code, card expiration, and customer default</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <FailureReasonsChart data={dashboard.failure_reasons} />
                </CardContent>
              </Card>
            </div>

            {/* Secondary Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-5">
                <CardHeader className="p-0 pb-3">
                  <CardTitle>Channel Performance</CardTitle>
                  <CardDescription>Conversion win rate by channel</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ChannelPerformanceChart data={dashboard.channel_performance} />
                </CardContent>
              </Card>

              <Card className="p-5">
                <CardHeader className="p-0 pb-3">
                  <CardTitle>Recovery Funnel</CardTitle>
                  <CardDescription>Progression from default to settled</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <RecoveryFunnelChart data={dashboard.recovery_funnel} />
                </CardContent>
              </Card>

              <Card className="p-5">
                <CardHeader className="p-0 pb-3">
                  <CardTitle>Risk Tier Calibration</CardTitle>
                  <CardDescription>XGBoost score distribution</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ProbabilityDistributionChart data={dashboard.risk_distribution} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: Batch Simulator Cockpit */}
        {activeTab === "batch" && (
          <Card className="p-6">
            <CardHeader className="p-0 pb-5">
              <CardTitle>Bounded Batch Agent Cockpit</CardTitle>
              <CardDescription>
                Run multi-agent reasoning across pending default cases with strict EV guardrails.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-xl bg-secondary/40 border border-border">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Batch Limit</span>
                    <span className="font-bold text-foreground tabular-nums">{batchLimit} cases</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={batchLimit}
                    onChange={(e) => setBatchLimit(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-1.5 bg-secondary rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-muted-foreground">Outreach Persona</label>
                  <select
                    value={batchTone}
                    onChange={(e) => setBatchTone(e.target.value)}
                    className="w-full h-8 rounded-lg border border-border bg-background px-3 text-xs font-mono text-foreground outline-none"
                  >
                    <option value="friendly">Friendly Reminder</option>
                    <option value="urgent">Urgent Overdue Notice</option>
                    <option value="empathetic">Empathetic / Assistance</option>
                  </select>
                </div>

                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs font-mono">
                    <input
                      type="checkbox"
                      checked={batchDry}
                      onChange={(e) => setBatchDry(e.target.checked)}
                      className="accent-emerald-600 rounded"
                    />
                    <span className="text-muted-foreground">Dry Run (No Dispatch)</span>
                  </label>

                  <Button
                    onClick={runBatchAgent}
                    disabled={batchBusy}
                    className="flex-1"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    {batchBusy ? "Processing..." : "Run Batch Engine"}
                  </Button>
                </div>
              </div>

              {batchResult && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono">
                    <div className="p-3.5 rounded-lg border border-border bg-card">
                      <div className="text-[11px] text-muted-foreground">Considered</div>
                      <div className="text-xl font-bold text-foreground mt-0.5">{batchResult.considered}</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-border bg-card">
                      <div className="text-[11px] text-muted-foreground">Acted</div>
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{batchResult.acted}</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-border bg-card">
                      <div className="text-[11px] text-muted-foreground">Refused</div>
                      <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{batchResult.refused}</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-border bg-card">
                      <div className="text-[11px] text-muted-foreground">Projected Net</div>
                      <div className="text-xl font-bold text-foreground mt-0.5">₹{(batchResult.projected_net_inr || 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                        <tr>
                          <th className="p-2.5 pl-4">Case ID</th>
                          <th className="p-2.5">Decision</th>
                          <th className="p-2.5">Risk Tier</th>
                          <th className="p-2.5">Channel</th>
                          <th className="p-2.5 text-right pr-4">Expected Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {batchResult.results.map((r) => (
                          <tr key={r.case_id} className="hover:bg-secondary/30">
                            <td className="p-2.5 pl-4 truncate max-w-[140px] text-muted-foreground">{r.case_id}</td>
                            <td className="p-2.5">
                              {r.decision === "act" ? (
                                <Badge variant="settled">Act</Badge>
                              ) : (
                                <Badge variant="refused">{r.refusal_reason || "Refused"}</Badge>
                              )}
                            </td>
                            <td className="p-2.5">{r.risk_level || "Medium"}</td>
                            <td className="p-2.5">{r.channel || "None"}</td>
                            <td className="p-2.5 text-right pr-4 font-bold tabular-nums">
                              ₹{(r.expected_value_inr || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 3: Payment Links */}
        {activeTab === "links" && (
          <Card className="p-5">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-sm">Active Payment Recovery Links</CardTitle>
              <CardDescription className="text-xs">Razorpay test gateway links generated by the autonomous dispatch agent</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-[6px] border border-border overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-secondary/40 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-2.5 pl-4">Link ID</th>
                      <th className="p-2.5">Case ID</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paymentLinks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
                          No payment links generated yet. Run the agent on a case to dispatch links.
                        </td>
                      </tr>
                    ) : (
                      paymentLinks.map((l) => (
                        <tr key={l.link_id} className="hover:bg-secondary/30">
                          <td className="p-2.5 pl-4 font-bold text-foreground">{l.link_id}</td>
                          <td className="p-2.5 text-muted-foreground truncate max-w-[140px]">{l.case_id || "Direct"}</td>
                          <td className="p-2.5 font-bold tabular-nums">₹{l.amount.toLocaleString("en-IN")}</td>
                          <td className="p-2.5">
                            <Badge variant={l.status === "paid" ? "settled" : "pending"}>
                              {l.status}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-right pr-4">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                navigator.clipboard.writeText(l.short_url || `https://rzp.io/i/${l.link_id}`);
                                toast.success("Payment link copied to clipboard");
                              }}
                              className="h-6 text-[10px] font-mono"
                            >
                              Copy Link
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </WorkbenchShell>
  );
}