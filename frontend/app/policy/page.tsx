"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkbenchShell } from "@/components/workbench-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { PolicyData } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

const RULE_COPY: Record<string, string> = {
  already_resolved: "Terminal cases (recovered / lost) are never touched again.",
  attempt_cap: "A case gets at most N attempts in any rolling 30-day window.",
  cooldown: "No two attempts on the same case within the cooldown window.",
  low_expected_value: "Outreach must clear the expected-value floor or it is refused.",
  quiet_hours: "No customer-facing outreach during IST night hours.",
};

export default function PolicyPage() {
  const { data: policy, isLoading } = useQuery<PolicyData>({
    queryKey: ["policy"],
    queryFn: () => api.getPolicy(),
    staleTime: 1000 * 60,
  });

  return (
    <WorkbenchShell activeViewTitle="Guardrails & Policy">
      <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Mathematical Policy &amp; Refusal Invariant
            </h1>
            <span className="rounded-[3px] border border-border bg-secondary/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              Autonomous Guardrail
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed font-mono">
            Every recovery intervention must clear the expected-value floor before dispatch. If expected return is below the floor, the intervention is refused and logged.
          </p>
        </div>

        {/* Math Formula Card with Monospace Micro-Tags */}
        <Card className="p-5 bg-card border-border">
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
            <Badge variant="inflight" className="px-2.5 py-1">
              P(recovery)
            </Badge>
            <span className="text-muted-foreground font-bold">×</span>
            <Badge variant="settled" className="px-2.5 py-1">
              (Gross Amount × 70% Margin)
            </Badge>
            <span className="text-muted-foreground font-bold">−</span>
            <Badge variant="refused" className="px-2.5 py-1">
              Channel Toll
            </Badge>
            <span className="text-muted-foreground text-sm font-bold">≥</span>
            <Badge variant="pending" className="px-2.5 py-1">
              ₹45.00 Floor
            </Badge>
          </div>
        </Card>

        {/* 3 Core Rules Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 space-y-1.5">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-foreground">
              1. Margin, Not Gross
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed font-sans">
              Recovering a rupee of revenue is worth its contribution margin, not face value. The engine prices every attempt in integer paise.
            </CardDescription>
          </Card>

          <Card className="p-4 space-y-1.5">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-foreground">
              2. Channel Toll Subtracted
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed font-sans">
              SMS tolls, WhatsApp fees, Razorpay transaction fees, and telephony minutes are charged against EV before attempting outreach.
            </CardDescription>
          </Card>

          <Card className="p-4 space-y-1.5">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-foreground">
              3. Refusals Immutable
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed font-sans">
              When the math does not clear the floor, the intervention is refused and the exact arithmetic is committed to the audit ledger.
            </CardDescription>
          </Card>
        </div>

        {/* Live Parameters from PostgreSQL */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-foreground">
                Runtime Guardrail Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Active thresholds loaded from PostgreSQL configuration
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Enforced by PolicyGuardAgent</span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs font-mono text-muted-foreground">
              Loading parameters...
            </div>
          ) : policy ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-[4px] border border-border bg-secondary/40">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Contribution Margin</div>
                <div className="text-base font-bold text-foreground mt-1 tabular-nums">
                  {(policy.contribution_margin * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-3 rounded-[4px] border border-border bg-secondary/40">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider">EV Floor</div>
                <div className="text-base font-bold text-foreground mt-1 tabular-nums">
                  ₹{policy.floor_inr}.00
                </div>
              </div>
              <div className="p-3 rounded-[4px] border border-border bg-secondary/40">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Max Attempts / 30d</div>
                <div className="text-base font-bold text-foreground mt-1 tabular-nums">
                  {policy.max_attempts_per_case_30d}
                </div>
              </div>
              <div className="p-3 rounded-[4px] border border-border bg-secondary/40">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Cooldown Window</div>
                <div className="text-base font-bold text-foreground mt-1 tabular-nums">
                  {policy.cooldown_hours} hours
                </div>
              </div>
            </div>
          ) : null}

          {/* Hard Guardrails List */}
          <div className="space-y-2 pt-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono text-muted-foreground">
              Enforced Policy Rules
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
              {policy?.rules?.map((rule) => (
                <div key={rule} className="p-2.5 rounded-[4px] border border-border bg-secondary/20 flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <div>
                    <div className="font-semibold text-foreground">{rule}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {RULE_COPY[rule] || "Enforced at runtime."}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </WorkbenchShell>
  );
}