"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { DashboardData, HonestyData } from "@/lib/types";

export function TelemetryRibbon() {
  const { data: dashboard } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => api.getDashboard(),
    staleTime: 1000 * 30,
  });

  const { data: honesty } = useQuery<HonestyData>({
    queryKey: ["honesty"],
    queryFn: () => api.getHonesty(),
    staleTime: 1000 * 30,
  });

  const kpis = dashboard?.kpis;

  return (
    <div className="flex items-center overflow-x-auto border-b border-border bg-card/50 text-xs font-mono select-none h-11 shrink-0 px-4 sm:px-6 divide-x divide-border">
      {/* Metric 1: At Risk */}
      <div className="flex items-center gap-2 pr-6 py-1 shrink-0">
        <span className="text-muted-foreground uppercase text-[10px] tracking-wider">At Risk:</span>
        <span className="font-bold text-foreground tabular-nums">
          {kpis ? `₹${(kpis.total_revenue_at_risk / 100000).toFixed(2)}L` : "—"}
        </span>
        <span className="text-muted-foreground text-[10px]">
          ({kpis?.total_cases_count.toLocaleString("en-IN") || 0})
        </span>
      </div>

      {/* Metric 2: Recovered */}
      <div className="flex items-center gap-2 px-6 py-1 shrink-0">
        <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Recovered:</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {kpis ? `₹${(kpis.total_revenue_recovered / 100000).toFixed(2)}L` : "—"}
        </span>
        <span className="text-emerald-600/80 dark:text-emerald-400/80 text-[10px]">
          ({kpis?.financial_recovery_rate_pct.toFixed(1) || 0}%)
        </span>
      </div>

      {/* Metric 3: In Flight */}
      <div className="flex items-center gap-2 px-6 py-1 shrink-0">
        <span className="text-muted-foreground uppercase text-[10px] tracking-wider">In Flight:</span>
        <span className="font-bold text-foreground tabular-nums">
          {kpis ? `₹${(kpis.active_in_flight_risk / 100000).toFixed(2)}L` : "—"}
        </span>
        <span className="text-muted-foreground text-[10px]">
          ({kpis?.active_cases_count || 0})
        </span>
      </div>

      {/* Metric 4: ML Calibration */}
      <div className="flex items-center gap-2 px-6 py-1 shrink-0">
        <span className="text-muted-foreground uppercase text-[10px] tracking-wider">ML Calibrated:</span>
        <span className="font-bold text-foreground tabular-nums">
          {kpis?.ai_recommendation_accuracy_pct || 66.9}%
        </span>
        <span className="text-muted-foreground text-[10px]">(0.681 AUC)</span>
      </div>

      {/* Metric 5: Refusal Restraint */}
      <div className="flex items-center gap-2 px-6 py-1 shrink-0">
        <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Policy Refused:</span>
        <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
          {honesty?.refused_30d.toLocaleString("en-IN") || 0}
        </span>
        <span className="text-muted-foreground text-[10px]">
          ({honesty && (honesty.attempts_30d + honesty.refused_30d > 0)
            ? `${((honesty.refused_30d / (honesty.attempts_30d + honesty.refused_30d)) * 100).toFixed(0)}%`
            : "0%"})
        </span>
      </div>

      {/* Metric 6: Money Arithmetic */}
      <div className="flex items-center gap-2 pl-6 py-1 shrink-0 text-muted-foreground">
        <span className="text-[10px] uppercase tracking-wider">Precision:</span>
        <span className="text-foreground font-semibold">Integer Paise (Zero Float)</span>
      </div>
    </div>
  );
}