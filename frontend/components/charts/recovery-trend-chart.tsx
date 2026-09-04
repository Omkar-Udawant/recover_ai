"use client";

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
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
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
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="shortDate"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#334155",
              borderRadius: "0.5rem",
              fontSize: "12px",
              color: "#f8fafc",
            }}
            formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
          />
          <Area
            type="monotone"
            dataKey="recovered_amount"
            name="Recovered"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#recoveredGrad)"
          />
          <Area
            type="monotone"
            dataKey="lost_amount"
            name="Lost"
            stroke="#f43f5e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#lostGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
