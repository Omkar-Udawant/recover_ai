"use client";

import { useState } from "react";
import { Bot, Layers, Sparkles, Zap } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { CaseTable } from "@/components/case-table";
import { CaseDetailModal } from "@/components/case-detail-modal";
import { Badge } from "@/components/ui/badge";

export default function CasesPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Revenue Recovery Cases
              </h1>
              <Badge variant="success" className="text-xs">
                5,000+ Records
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Select any failed transaction to trigger the multi-agent AI pipeline or inspect the action timeline.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Click any case row to inspect dossier & run AI</span>
          </div>
        </div>

        {/* Case Table */}
        <CaseTable
          key={refreshTrigger}
          onSelectCase={(id) => setSelectedCaseId(id)}
        />

        {/* Case Inspection & Agent Trigger Modal */}
        <CaseDetailModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onCaseUpdated={() => setRefreshTrigger((prev) => prev + 1)}
        />
      </main>
    </div>
  );
}
