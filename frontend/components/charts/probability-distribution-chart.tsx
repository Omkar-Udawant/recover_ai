"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RiskDistributionItem } from "@/lib/types";

interface ProbabilityDistributionChartProps {
  data: RiskDistributionItem[];
}

const RISK_COLORS: Record<string, string> = {
  High: "#F43F5E",
  Medium: "#F59E0B",
  Low: "#059669",
};

export function ProbabilityDistributionChart({
  data,
}: ProbabilityDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs font-mono text-muted-foreground">
        No risk distribution data
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-white/[0.08]" vertical={false} />
          <XAxis
            dataKey="risk_level"
            stroke="#94a3b8"
            fontSize={11}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card, #ffffff)",
              borderColor: "var(--border, #e2e8f0)",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
              fontSize: "11px",
              color: "var(--foreground, #0f172a)",
            }}
            itemStyle={{ color: "var(--foreground, #0f172a)" }}
            labelStyle={{ color: "var(--foreground, #0f172a)", fontWeight: 600 }}
            formatter={(val: any, name: any, item: any) => [
              `${val}% Win Rate (${item.payload.count} cases, Avg Prob: ${(item.payload.avg_probability * 100).toFixed(1)}%)`,
              "Recovery Rate",
            ]}
          />
          <Bar dataKey="recovery_rate_pct" name="Recovery Rate" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={RISK_COLORS[entry.risk_level] || "#0284c7"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
