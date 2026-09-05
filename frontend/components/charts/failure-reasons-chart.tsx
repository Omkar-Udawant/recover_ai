"use client";

import React from "react";
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
import { FailureReasonItem } from "@/lib/types";

interface FailureReasonsChartProps {
  data: FailureReasonItem[];
}

const PASTEL_ACCENTS = [
  "#F43F5E", // Rose
  "#F59E0B", // Amber
  "#059669", // Emerald
  "#0284C7", // Sky
  "#7C3AED", // Violet
  "#DB2777", // Pink
];

export function FailureReasonsChart({ data }: FailureReasonsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs font-mono text-muted-foreground">
        No failure reason data
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-white/[0.08]" horizontal={false} />
          <XAxis
            type="number"
            stroke="#94a3b8"
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="reason"
            stroke="#64748b"
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
            width={110}
            tickFormatter={(val) => val.replace(/_/g, " ")}
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
            formatter={(value: any, name: any, item: any) => [
              `${value} cases (₹${Number(item.payload.amount).toLocaleString("en-IN")})`,
              "Volume",
            ]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PASTEL_ACCENTS[index % PASTEL_ACCENTS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
