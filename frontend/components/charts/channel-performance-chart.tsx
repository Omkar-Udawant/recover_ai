"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChannelPerformanceItem } from "@/lib/types";

interface ChannelPerformanceChartProps {
  data: ChannelPerformanceItem[];
}

export function ChannelPerformanceChart({ data }: ChannelPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs font-mono text-slate-500">
        No channel data
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-white/[0.08]" vertical={false} />
          <XAxis
            dataKey="channel"
            stroke="#94a3b8"
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val.replace("_", " ")}
          />
          <YAxis
            yAxisId="left"
            stroke="#94a3b8"
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#059669"
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
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            formatter={(value) => (
              <span className="text-muted-foreground font-medium text-xs">{value}</span>
            )}
          />
          <Bar
            yAxisId="left"
            dataKey="total_cases"
            name="Total Cases"
            fill="#CBD5E1"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="left"
            dataKey="recovered_cases"
            name="Recovered Won Back"
            fill="#059669"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
