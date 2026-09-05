"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { CaseListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CaseTableProps {
  selectedCaseId?: string | null;
  onSelectCase: (caseId: string) => void;
}

export function CaseTable({ selectedCaseId, onSelectCase }: CaseTableProps) {
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [search, setSearch] = useState<string>("");
  const [submittedSearch, setSubmittedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [channelFilter, setChannelFilter] = useState<string>("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["cases", page, pageSize, submittedSearch, statusFilter, riskFilter, channelFilter],
    queryFn: () =>
      api.getCases({
        page,
        page_size: pageSize,
        search: submittedSearch || undefined,
        status: statusFilter || undefined,
        risk_level: riskFilter || undefined,
        channel: channelFilter || undefined,
      }),
    staleTime: 1000 * 20,
  });

  const cases: CaseListItem[] = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSubmittedSearch(search);
  };

  const clearFilters = () => {
    setSearch("");
    setSubmittedSearch("");
    setStatusFilter("");
    setRiskFilter("");
    setChannelFilter("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(submittedSearch || statusFilter || riskFilter || channelFilter);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "recovered":
        return <Badge variant="settled">Settled</Badge>;
      case "active":
      case "in_flight":
        return <Badge variant="inflight">In Flight</Badge>;
      case "pending":
        return <Badge variant="pending">Pending</Badge>;
      case "failed":
      case "lost":
        return <Badge variant="refused">Defaulted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskBadge = (risk?: string, prob?: number) => {
    const p = prob !== undefined ? `${(prob * 100).toFixed(0)}%` : "";
    switch (risk?.toLowerCase()) {
      case "low":
        return (
          <Badge variant="settled" className="gap-1 font-mono">
            <span>Low</span>
            {p && <span className="opacity-70 tabular-nums">· {p}</span>}
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="pending" className="gap-1 font-mono">
            <span>Medium</span>
            {p && <span className="opacity-70 tabular-nums">· {p}</span>}
          </Badge>
        );
      case "high":
        return (
          <Badge variant="refused" className="gap-1 font-mono">
            <span>High</span>
            {p && <span className="opacity-70 tabular-nums">· {p}</span>}
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unscored</Badge>;
    }
  };

  const getChannelTag = (ch?: string) => {
    if (!ch) {
      return (
        <span className="inline-flex items-center gap-1 rounded-[3px] border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          Unassigned
        </span>
      );
    }
    const lower = ch.toLowerCase();
    return (
      <span className="inline-flex items-center gap-1 rounded-[3px] border border-border bg-secondary/50 px-1.5 py-0.5 text-[10px] font-mono text-foreground">
        {lower === "email" && <Mail className="h-2.5 w-2.5 text-sky-600 dark:text-sky-400" />}
        {(lower === "sms" || lower === "whatsapp") && (
          <MessageSquare className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
        )}
        {lower === "voice" && <Phone className="h-2.5 w-2.5 text-violet-600 dark:text-violet-400" />}
        <span className="capitalize">{ch}</span>
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 p-2.5 rounded-[6px] border border-border bg-card">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or case ID..."
            className="pl-8 h-8 text-xs font-mono"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-[4px] border border-border bg-background px-2 text-xs font-mono text-foreground outline-none transition-colors hover:border-border/80"
          >
            <option value="">All Statuses</option>
            <option value="active">In Flight</option>
            <option value="recovered">Settled</option>
            <option value="pending">Pending</option>
            <option value="lost">Defaulted</option>
          </select>

          {/* Risk filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-[4px] border border-border bg-background px-2 text-xs font-mono text-foreground outline-none transition-colors hover:border-border/80"
          >
            <option value="">All Risk Tiers</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          {/* Channel filter */}
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-[4px] border border-border bg-background px-2 text-xs font-mono text-foreground outline-none transition-colors hover:border-border/80"
          >
            <option value="">All Channels</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="voice">Telephony Voice</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={clearFilters}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 h-8 px-2 font-mono text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}

          <Button
            variant="outline"
            size="iconSm"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh list"
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="rounded-[6px] border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-secondary/40 text-muted-foreground font-mono text-[10px] uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Case / Customer</th>
                <th className="py-2.5 px-3">Default Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Risk Tier</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Overdue</th>
                <th className="py-2.5 px-3 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs font-mono text-muted-foreground">
                    Synchronizing case directory...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs font-mono text-muted-foreground">
                    No matching cases found in ledger.
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const isSelected = selectedCaseId === c.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCase(c.id)}
                      className={cn(
                        "cursor-pointer transition-colors group",
                        isSelected
                          ? "bg-secondary/80 border-l-2 border-l-emerald-600 dark:border-l-emerald-400"
                          : "hover:bg-secondary/30"
                      )}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {c.customer_name}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
                          {c.customer_email} · #{c.id.slice(0, 8)}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-foreground tabular-nums">
                        ₹{c.amount.toLocaleString("en-IN")}
                      </td>

                      <td className="py-2.5 px-3">{getStatusBadge(c.status)}</td>

                      <td className="py-2.5 px-3">
                        {getRiskBadge(c.risk_level, c.recovery_probability)}
                      </td>

                      <td className="py-2.5 px-3">{getChannelTag(c.assigned_channel)}</td>

                      <td className="py-2.5 px-3 font-mono text-muted-foreground tabular-nums">
                        {c.days_overdue}d
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <Button
                          size="xs"
                          variant={isSelected ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(c.id);
                          }}
                          className="font-mono text-[11px] h-7"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-card font-mono text-[11px] text-muted-foreground">
          <div>
            Showing <span className="font-bold text-foreground">{cases.length}</span> of{" "}
            <span className="font-bold text-foreground">{total.toLocaleString("en-IN")}</span> cases
          </div>

          <div className="flex items-center gap-2">
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="iconSm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-6 w-6"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="iconSm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-6 w-6"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}