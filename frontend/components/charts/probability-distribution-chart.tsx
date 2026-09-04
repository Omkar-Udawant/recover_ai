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
  High: "#f43f5e",
  Medium: "#f59e0b",
  Low: "#10b981",
};

export function ProbabilityDistributionChart({
  data,
}: ProbabilityDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
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
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="risk_level"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#334155",
              borderRadius: "0.5rem",
              fontSize: "12px",
              color: "#f8fafc",
            }}
            formatter={(val: any, name: any, item: any) => [
              `${val}% Win Rate (${item.payload.count} cases, Avg Prob: ${(item.payload.avg_probability * 100).toFixed(1)}%)`,
              "Recovery Rate",
            ]}
          />
          <Bar dataKey="recovery_rate_pct" name="Recovery Rate" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={RISK_COLORS[entry.risk_level] || "#3b82f6"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
