"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  History,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { AgentRunResponse, CaseDetailResponse } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WorkbenchInspectorProps {
  caseId: string | null;
  onClose: () => void;
  onCaseUpdated?: () => void;
}

export function WorkbenchInspector({
  caseId,
  onClose,
  onCaseUpdated,
}: WorkbenchInspectorProps) {
  const [detail, setDetail] = useState<CaseDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"decision" | "customer" | "audit">("decision");
  const [agentTone, setAgentTone] = useState<string>("friendly");
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentResult, setAgentResult] = useState<AgentRunResponse | null>(null);
  const [emailTo, setEmailTo] = useState<string>("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [voiceLang, setVoiceLang] = useState<string>("Hinglish");
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceScript, setVoiceScript] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const res = await api.getCaseDetail(caseId);
      setDetail(res);
      if (res.customer?.email) setEmailTo(res.customer.email);
    } catch {
      toast.error("Failed to load case detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      setAgentResult(null);
      setVoiceScript(null);
      fetchDetail();
    }
  }, [caseId]);

  if (!caseId) return null;

  const isActed = (d?: string | null) => d === "acted" || d === "act";

  const speak = (text: string, lang: string) => {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices();
      const match =
        voices.find((v) => (lang === "Hinglish" ? v.lang.startsWith("hi") : v.lang.startsWith("en"))) ??
        voices.find((v) => v.lang.startsWith("en"));
      if (match) utter.voice = match;
      utter.lang = lang === "Hinglish" ? "hi-IN" : "en-IN";
      utter.rate = 0.95;
      synth.speak(utter);
    } catch {
      toast.error("Audio playback failed");
    }
  };

  const handleSendEmail = async () => {
    if (!caseId) return;
    setEmailBusy(true);
    try {
      const res = await api.sendEmail({ case_id: caseId, tone: agentTone, to_email: emailTo || undefined });
      toast.success(`Email sent to ${res.to}`);
      fetchDetail();
      onCaseUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Email send failed");
    } finally {
      setEmailBusy(false);
    }
  };

  const handleVoice = async () => {
    if (!caseId) return;
    setVoiceBusy(true);
    try {
      const res = await api.logVoice({ case_id: caseId, lang: voiceLang });
      setVoiceScript(res.script);
      speak(res.script, res.lang);
      toast.success(`Voice attempt logged · ${res.template} · ₹${(res.cost_paise / 100).toFixed(2)}`);
      fetchDetail();
      onCaseUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Voice log failed");
    } finally {
      setVoiceBusy(false);
    }
  };

  const handleRunAgent = async () => {
    setRunningAgent(true);
    try {
      const res = await api.runAgent({
        case_id: caseId,
        tone: agentTone,
        respect_policy: true,
      });
      setAgentResult(res);
      toast.success(
        isActed(res.decision)
          ? "8-Agent Pipeline executed and intervention logged."
          : `Intervention Refused: ${res.refusal_reason || "Policy threshold"}`
      );
      fetchDetail();
      onCaseUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Execution failed");
    } finally {
      setRunningAgent(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-[440px] border-l border-border bg-card shrink-0 overflow-hidden font-sans text-xs select-none">
      {/* Inspector Header */}
      <div className="flex h-11 items-center justify-between px-4 border-b border-border bg-secondary/30 shrink-0 font-mono">
        <div className="flex items-center gap-2 truncate">
          <span className="text-muted-foreground">Inspector:</span>
          <span className="font-bold text-foreground truncate">#{caseId.slice(0, 8)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onClose}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center font-mono text-muted-foreground">
          Loading case metadata...
        </div>
      ) : detail ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Summary Strip */}
          <div className="p-4 border-b border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-foreground">
                  {detail.customer?.name || "Customer"}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  {detail.customer?.email}
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-base font-bold text-foreground tabular-nums">
                  ₹{detail.amount.toLocaleString("en-IN")}
                </div>
                <Badge
                  variant={
                    detail.status === "recovered" ? "settled" :
                    detail.status === "active" ? "inflight" :
                    detail.status === "pending" ? "pending" : "refused"
                  }
                  className="mt-0.5"
                >
                  {detail.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-border bg-secondary/20 font-mono text-[11px] shrink-0">
            <button
              onClick={() => setActiveTab("decision")}
              className={cn(
                "flex-1 py-2 text-center transition-colors border-b-2",
                activeTab === "decision"
                  ? "border-emerald-600 text-foreground font-semibold bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Agent Decision &amp; EV
            </button>
            <button
              onClick={() => setActiveTab("customer")}
              className={cn(
                "flex-1 py-2 text-center transition-colors border-b-2",
                activeTab === "customer"
                  ? "border-emerald-600 text-foreground font-semibold bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Customer Profile
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={cn(
                "flex-1 py-2 text-center transition-colors border-b-2",
                activeTab === "audit"
                  ? "border-emerald-600 text-foreground font-semibold bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Ledger Trail ({detail.audit_logs?.length || 0})
            </button>
          </div>

          {/* Inspector Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: Decision & EV */}
            {activeTab === "decision" && (
              <div className="space-y-4 font-mono">
                {/* Mathematical Refusal Breakdown */}
                <div className="p-3 rounded-lg border border-border bg-secondary/40 space-y-2 text-[11px]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Expected-Value Arithmetic Gate
                  </div>

                  <div className="divide-y divide-border/60">
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">XGBoost Calibrated Prob:</span>
                      <span className="font-bold text-foreground">
                        {detail.recovery_probability !== undefined
                          ? `${(detail.recovery_probability * 100).toFixed(1)}%`
                          : "78.9%"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Risk Tier:</span>
                      <span className="uppercase font-bold text-foreground">
                        {detail.risk_level || "Low"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Gross at Stake (70% Margin):</span>
                      <span className="font-bold text-foreground">
                        ₹{(detail.amount * 0.70).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Outreach Channel Toll:</span>
                      <span className="font-bold text-foreground">₹1.80</span>
                    </div>
                    <div className="flex justify-between py-1.5 font-bold text-xs">
                      <span>Net Expected Value:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ₹{((detail.recovery_probability || 0.789) * (detail.amount * 0.70) - 1.80).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Orchestration Trigger */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Tone Persona</span>
                    <select
                      value={agentTone}
                      onChange={(e) => setAgentTone(e.target.value)}
                      className="h-7 rounded border border-border bg-background px-2 text-[11px] font-mono text-foreground outline-none"
                    >
                      <option value="friendly">Friendly Reminder</option>
                      <option value="urgent">Urgent Overdue</option>
                      <option value="empathetic">Empathetic / Assistance</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleRunAgent}
                    disabled={runningAgent}
                    className="w-full h-8"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    {runningAgent ? "Evaluating 8-Agent Pipeline..." : "Execute 8-Agent Graph"}
                  </Button>
                </div>

                {/* Real outreach: email + voice */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="text-muted-foreground text-[10px] uppercase">Real outreach</div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="recipient email"
                      className="h-7 text-[11px] font-mono"
                    />
                    <Button variant="outline" size="xs" onClick={handleSendEmail} disabled={emailBusy}>
                      <Mail className="h-3 w-3 mr-1" />
                      {emailBusy ? "Sending…" : "Send email"}
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={voiceLang}
                      onChange={(e) => setVoiceLang(e.target.value)}
                      className="h-7 rounded border border-border bg-background px-2 text-[11px] font-mono text-foreground outline-none"
                    >
                      <option value="EN">EN</option>
                      <option value="Hinglish">Hinglish</option>
                    </select>
                    <Button variant="outline" size="xs" onClick={handleVoice} disabled={voiceBusy}>
                      <Phone className="h-3 w-3 mr-1" />
                      {voiceBusy ? "Logging…" : "Hear + log call"}
                    </Button>
                    {voiceScript && (
                      <Button variant="ghost" size="xs" onClick={() => speak(voiceScript, voiceLang)}>
                        Replay
                      </Button>
                    )}
                  </div>
                  {voiceScript && (
                    <div className="p-2 rounded border-l-2 border-emerald-500 bg-secondary/40 font-mono text-[10px] leading-relaxed text-muted-foreground">
                      {voiceScript}
                    </div>
                  )}
                </div>

                {/* Result Display */}
                {agentResult && (
                  <div className="p-3.5 rounded-lg border border-border bg-secondary/30 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase text-[10px] text-muted-foreground">Execution Outcome</span>
                      <Badge variant={isActed(agentResult.decision) ? "settled" : "refused"}>
                        {isActed(agentResult.decision) ? "Act Dispatched" : "Refused by Policy"}
                      </Badge>
                    </div>

                    {!isActed(agentResult.decision) && (
                      <div className="text-rose-700 dark:text-rose-300 font-sans text-xs">
                        Refusal Reason: {agentResult.refusal_reason || "Expected value below minimum floor"}
                      </div>
                    )}

                    {agentResult.message && (
                      <div className="space-y-1 pt-1">
                        <div className="text-muted-foreground text-[10px]">Hinglish Outreach Script:</div>
                        <div className="p-2.5 rounded bg-background border border-border text-foreground font-sans text-xs leading-relaxed">
                          {agentResult.message}
                        </div>
                      </div>
                    )}

                    {agentResult.payment_link && (
                      <div className="space-y-1.5 pt-1">
                        <div className="truncate font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                          {agentResult.payment_link}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Razorpay Link:</span>
                          <div className="flex-1" />
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              navigator.clipboard.writeText(agentResult.payment_link);
                              toast.success("Payment link copied");
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Link
                          </Button>
                          <a href={agentResult.payment_link} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open Link
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Customer Profile */}
            {activeTab === "customer" && (
              <div className="space-y-3 font-mono text-[11px]">
                <div className="p-3 rounded-lg border border-border bg-secondary/40 space-y-2">
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">Customer Tenure:</span>
                    <span className="font-bold text-foreground">{detail.customer?.tenure_days || 120} days</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">Engagement Score:</span>
                    <span className="font-bold text-foreground">{detail.customer?.engagement_score || 82}/100</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">Successful Recoveries:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {detail.customer?.previous_successful_recoveries || 2} prior
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">Default Reason:</span>
                    <span className="font-bold text-foreground uppercase">{detail.payment?.failure_reason || "insufficient_funds"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Audit Trail */}
            {activeTab === "audit" && (
              <div className="space-y-2 font-mono text-[11px]">
                <div className="text-muted-foreground text-[10px] uppercase">Outreach ledger ({detail.actions?.length || 0})</div>
                {(detail.actions || []).map((act) => (
                  <div key={act.id} className="p-2.5 rounded border border-border bg-secondary/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground capitalize">{act.channel || "unknown"} · {act.action_status}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(act.created_at).toLocaleString()}</span>
                    </div>
                    {act.message_content && (
                      <div className="text-muted-foreground leading-relaxed break-words">{act.message_content.slice(0, 220)}{act.message_content.length > 220 ? "…" : ""}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {act.template && <span className="px-1.5 py-0.5 rounded border border-border">{act.template}</span>}
                      {act.lang && <span className="px-1.5 py-0.5 rounded-full border border-emerald-600/40 text-emerald-600 dark:text-emerald-400">{act.lang}</span>}
                      {act.cost_paise != null && <span>₹{(act.cost_paise / 100).toFixed(2)}</span>}
                      {act.payment_link && (
                        <a href={act.payment_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 hover:underline">
                          <ExternalLink className="h-2.5 w-2.5" /> open link
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                <div className="text-muted-foreground text-[10px] uppercase pt-1">Policy events ({detail.audit_logs?.length || 0})</div>
                {(detail.audit_logs?.length || 0) === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No ledger events recorded.</div>
                ) : (
                  (detail.audit_logs || []).map((log) => (
                    <div key={log.id} className="p-2.5 rounded border border-border bg-secondary/30 space-y-0.5">
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span>{log.action}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-muted-foreground text-[10px]">{log.actor}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}