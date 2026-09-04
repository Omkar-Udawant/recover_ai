"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { PolicyData } from "@/lib/types";

const RULE_COPY: Record<string, string> = {
  already_resolved: "Terminal cases (recovered / lost) are never touched again.",
  attempt_cap: "A case gets at most N attempts in any rolling 30-day window.",
  cooldown: "No two attempts on the same case within the cooldown window.",
  low_expected_value: "Outreach must clear the expected-value floor or it is refused.",
  quiet_hours: "No customer-facing outreach during IST night hours.",
};

export default function PolicyPage() {
  const [policy, setPolicy] = useState<PolicyData | null>(null);

  useEffect(() => {
    api.getPolicy().then(setPolicy).catch(() => setPolicy(null));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
          The one idea everything hangs off
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Before any action fires, it has to clear this.
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl">
          A retry, a payment link, a call — every intervention must clear the expected-value
          gate first. That is the whole product, and it is why the answer is so often no.
        </p>

        <Card className="mt-6 border-slate-800 bg-slate-900/60">
          <CardContent className="pt-6 flex flex-wrap items-center justify-center gap-2 font-mono text-sm">
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-sm px-3 py-1">probability</Badge>
            <span className="text-slate-500">×</span>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-sm px-3 py-1">(amount × margin)</Badge>
            <span className="text-slate-500">−</span>
            <Badge variant="outline" className="border-rose-500/40 text-rose-300 text-sm px-3 py-1">cost</Badge>
            <span className="text-slate-400 text-lg">≥</span>
            <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-sm px-3 py-1">floor</Badge>
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader><CardTitle className="text-white text-base">Margin, not the gross amount</CardTitle></CardHeader>
            <CardContent className="text-xs text-slate-400 leading-relaxed">
              Recovering a rupee of revenue is worth its contribution margin, not a rupee.
              The gate prices every attempt in integer paise — no floating-point money anywhere.
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader><CardTitle className="text-white text-base">Stopping is derived, not configured</CardTitle></CardHeader>
            <CardContent className="text-xs text-slate-400 leading-relaxed">
              There is no maxAttempts constant doing the real work. A sequence ends when the
              expected value crosses the floor — the stopping rule falls out of the same arithmetic.
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader><CardTitle className="text-white text-base">Every refusal explains itself</CardTitle></CardHeader>
            <CardContent className="text-xs text-slate-400 leading-relaxed">
              Whatever the answer, the arithmetic and the rule that produced it are written to the
              audit trail beside it. A refused attempt is a first-class, inspectable outcome.
            </CardContent>
          </Card>
        </div>

        <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Live configuration — served by the API, not written into the page
        </h2>
        {!policy ? (
          <p className="mt-3 text-sm text-slate-500">Loading live policy…</p>
        ) : (
          <Card className="mt-3 border-slate-800 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-white text-base font-mono">{policy.gate}</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                margin {policy.contribution_margin} · cost ₹{policy.cost_per_attempt_inr}/attempt · floor ₹{policy.floor_inr} · quiet {policy.quiet_window_ist} IST
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {policy.rules.map((rule) => (
                <div key={rule} className="flex items-start justify-between gap-3 text-sm border-b border-slate-800/60 pb-2">
                  <Badge variant="outline" className="font-mono text-[11px] border-slate-700 text-slate-300 shrink-0">{rule}</Badge>
                  <p className="text-xs text-slate-400 text-right">{RULE_COPY[rule] ?? ""}</p>
                </div>
              ))}
              <p className="text-[11px] text-slate-500 pt-1">
                Attempt cap {policy.max_attempts_per_case_30d}/30d · cooldown {policy.cooldown_hours}h · quiet-hours enforcement {policy.quiet_hours_enforce ? "on" : "off"}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
