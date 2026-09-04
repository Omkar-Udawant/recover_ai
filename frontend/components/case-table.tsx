"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { CaseListItem } from "@/lib/types";

interface CaseTableProps {
  onSelectCase: (caseId: string) => void;
}

export function CaseTable({ onSelectCase }: CaseTableProps) {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [channelFilter, setChannelFilter] = useState<string>("");

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.getCases({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        risk_level: riskFilter || undefined,
        channel: channelFilter || undefined,
      });
      setCases(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to fetch cases", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, statusFilter, riskFilter, channelFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCases();
  };

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="border-slate-800 text-xs h-9">
            Search
          </Button>
        </form>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="link_opened">Link Opened</option>
            <option value="payment_attempted">Payment Attempted</option>
            <option value="recovered">Recovered</option>
            <option value="lost">Lost</option>
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Channels</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="voice_call">Voice Call</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchCases}
            disabled={loading}
            className="border-slate-800 text-xs h-9 text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">At-Risk Amount</th>
                <th className="px-4 py-3">Failure Reason</th>
                <th className="px-4 py-3">Risk Tier</th>
                <th className="px-4 py-3">ML Recovery Prob</th>
                <th className="px-4 py-3">Assigned Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Fetching live recovery cases...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No matching recovery cases found for current filters.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectCase(c.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {c.customer_name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {c.customer_email}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-200">
                      ₹{c.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3 text-slate-400 capitalize">
                      {c.failure_reason?.replace("_", " ") || "Payment failed"}
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          c.risk_level === "high"
                            ? "destructive"
                            : c.risk_level === "medium"
                            ? "warning"
                            : "success"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {c.risk_level}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 font-mono font-medium text-slate-300">
                      {c.recovery_probability ? `${(c.recovery_probability * 100).toFixed(1)}%` : "N/A"}
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize text-[11px] border-slate-700 text-slate-300">
                        {c.assigned_channel || "unassigned"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          c.status === "recovered"
                            ? "success"
                            : c.status === "lost"
                            ? "destructive"
                            : "warning"
                        }
                        className="capitalize text-[11px]"
                      >
                        {c.status.replace("_", " ")}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c.id);
                        }}
                        className="h-7 text-xs text-blue-400 hover:text-white hover:bg-blue-600/20"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/60 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-white">{Math.min(page * pageSize, total)}</span> of{" "}
            <span className="font-semibold text-white">{total.toLocaleString()}</span> cases
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || loading}
              className="h-8 border-slate-800 text-xs px-2.5"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>

            <span className="font-mono text-slate-300 px-1">
              Page {page} of {totalPages}
            </span>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="h-8 border-slate-800 text-xs px-2.5"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
