"use client";

import React, { useState } from "react";
import { WorkbenchShell } from "@/components/workbench-shell";
import { CaseTable } from "@/components/case-table";
import { WorkbenchInspector } from "@/components/workbench-inspector";

export default function CasesPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  return (
    <WorkbenchShell activeViewTitle="Case Ledger">
      <div className="flex h-full w-full overflow-hidden">
        {/* Main Ledger Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  Default Event Ledger
                </h1>
                <span className="rounded-[3px] border border-border bg-secondary/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  5,003 Synchronized
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Calibrated XGBoost recovery predictions evaluated against integer paise refusal policy.
              </p>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              Click any row to open split inspector &amp; orchestrate 8-agent DAG
            </div>
          </div>

          <CaseTable
            key={refreshTrigger}
            selectedCaseId={selectedCaseId}
            onSelectCase={(id) => setSelectedCaseId(id)}
          />
        </div>

        {/* 440px Split-view Inspector */}
        {selectedCaseId && (
          <WorkbenchInspector
            caseId={selectedCaseId}
            onClose={() => setSelectedCaseId(null)}
            onCaseUpdated={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}
      </div>
    </WorkbenchShell>
  );
}