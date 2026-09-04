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
import { DashboardData } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      console.error("Dashboard fetch error", err);
      setError("Failed to load dashboard data from API.");
    } finally {
      setLoading(false);
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
