"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendDataPoint } from "@/lib/types";

interface RecoveryTrendChartProps {
  data: TrendDataPoint[];
}

export function RecoveryTrendChart({ data }: RecoveryTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs font-mono text-slate-500">
        No trend data available
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    shortDate: d.date.substring(5),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-white/[0.08]" vertical={false} />
          <XAxis
            dataKey="shortDate"
            stroke="#94a3b8"
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
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
            formatter={(value: any, name: any) => [
              `₹${Number(value).toLocaleString("en-IN")}`,
              name === "recovered_amount" ? "Recovered Won Back" : "Lost Unrecovered",
            ]}
          />
          <Area
            type="monotone"
            dataKey="recovered_amount"
            name="recovered_amount"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#recoveredGrad)"
          />
          <Area
            type="monotone"
            dataKey="lost_amount"
            name="lost_amount"
            stroke="#F43F5E"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#lostGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
