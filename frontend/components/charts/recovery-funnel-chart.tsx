"use client";

import { FunnelStageItem } from "@/lib/types";
import { CheckCircle, Eye, Mail, ShieldAlert, Sparkles } from "lucide-react";

interface RecoveryFunnelChartProps {
  data: FunnelStageItem[];
}

const STAGE_ICONS = [
  ShieldAlert,
  Mail,
  Eye,
  Sparkles,
  CheckCircle,
];

const STAGE_COLORS = [
  "from-blue-600 to-blue-500",
  "from-indigo-600 to-indigo-500",
  "from-purple-600 to-purple-500",
  "from-amber-600 to-amber-500",
  "from-emerald-600 to-emerald-500",
];

export function RecoveryFunnelChart({ data }: RecoveryFunnelChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No funnel data
      </div>
    );
  }

  return (
    <div className="space-y-3.5 pt-2">
      {data.map((stage, idx) => {
        const Icon = STAGE_ICONS[idx % STAGE_ICONS.length];
        const gradient = STAGE_COLORS[idx % STAGE_COLORS.length];

        return (
          <div key={stage.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-foreground/90 font-medium">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{stage.stage}</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <span className="font-semibold font-mono tabular-nums text-foreground">
                  {stage.count.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  ({stage.percentage}%)
                </span>
              </div>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary border border-border">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                style={{ width: `${Math.max(stage.percentage, 3)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
