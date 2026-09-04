"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { AgentRunResponse, CaseDetailResponse, CaseListItem } from "@/lib/types";

interface CaseDetailModalProps {
  caseId: string | null;
  onClose: () => void;
  onCaseUpdated?: () => void;
}

export function CaseDetailModal({
  caseId,
  onClose,
  onCaseUpdated,
}: CaseDetailModalProps) {
  const [detail, setDetail] = useState<CaseDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [agentTone, setAgentTone] = useState<string>("friendly");
  const [runningAgent, setRunningAgent] = useState<boolean>(false);
  const [agentResult, setAgentResult] = useState<AgentRunResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [emailTo, setEmailTo] = useState<string>("");
  const [emailBusy, setEmailBusy] = useState<boolean>(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<string>("Hinglish");
  const [voiceBusy, setVoiceBusy] = useState<boolean>(false);
  const [voiceScript, setVoiceScript] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const res = await api.getCaseDetail(caseId);
      setDetail(res);
    } catch (err) {
      console.error("Failed to load case detail", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchDetail();
      setAgentResult(null);
      setVoiceScript(null);
      setEmailMsg(null);
    }
  }, [caseId]);

  useEffect(() => {
    if (detail?.customer?.email) setEmailTo(detail.customer.email);
  }, [detail]);

  const handleRunAgent = async () => {
    if (!detail) return;
    setRunningAgent(true);
    try {
      const res = await api.runAgent({
        case_id: detail.id,
        payment_id: detail.payment?.id,
        customer_id: detail.customer?.id,
        amount: detail.amount,
        customer_name: detail.customer?.name,
        customer_email: detail.customer?.email,
        customer_phone: detail.customer?.phone,
        tone: agentTone,
      });
      setAgentResult(res);
      await fetchDetail();
      if (onCaseUpdated) onCaseUpdated();
    } catch (err) {
      console.error("Agent execution failed", err);
    } finally {
      setRunningAgent(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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
    } catch (err) {
      console.error("TTS failed", err);
    }
  };

  const handleSendEmail = async () => {
    if (!detail) return;
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const res = await api.sendEmail({ case_id: detail.id, tone: agentTone, to_email: emailTo || undefined });
      setEmailMsg(`Sent to ${res.to} · ${res.template}`);
      await fetchDetail();
      if (onCaseUpdated) onCaseUpdated();
    } catch (err: any) {
      setEmailMsg(err?.response?.data?.detail ?? "Email send failed.");
    } finally {
      setEmailBusy(false);
    }
  };

  const handleVoice = async () => {
    if (!detail) return;
    setVoiceBusy(true);
    try {
      const res = await api.logVoice({ case_id: detail.id, lang: voiceLang });
      setVoiceScript(res.script);
      speak(res.script, res.lang);
      await fetchDetail();
      if (onCaseUpdated) onCaseUpdated();
    } catch (err) {
      console.error("Voice log failed", err);
    } finally {
      setVoiceBusy(false);
    }
  };

  if (!caseId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Recovery Case Inspection
                </h2>
                <Badge variant="outline" className="font-mono text-[11px] border-slate-700 text-slate-400">
                  {caseId.substring(0, 8)}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Agent Autonomous Recovery Timeline & Execution Center
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && !detail ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading full case dossier from database...</p>
            </div>
          ) : detail ? (
            <>
              {/* Top Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <div>
                  <span className="text-[11px] uppercase font-semibold text-slate-400">Customer</span>
                  <div className="text-sm font-bold text-white mt-0.5 truncate">{detail.customer?.name || "Unknown"}</div>
                  <div className="text-xs text-slate-400 truncate">{detail.customer?.email}</div>
                </div>

                <div>
                  <span className="text-[11px] uppercase font-semibold text-slate-400">At-Risk Amount</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    ₹{detail.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400">{detail.payment?.failure_reason?.replace("_", " ") || "Payment failed"}</div>
                </div>

                <div>
                  <span className="text-[11px] uppercase font-semibold text-slate-400">Status</span>
                  <div className="mt-1">
                    <Badge
                      variant={
                        detail.status === "recovered"
                          ? "success"
                          : detail.status === "lost"
                          ? "destructive"
                          : "warning"
                      }
                      className="capitalize text-xs font-semibold"
                    >
                      {detail.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] uppercase font-semibold text-slate-400">Recovery Prob (ML)</span>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">
                    {detail.recovery_probability ? `${(detail.recovery_probability * 100).toFixed(1)}%` : "N/A"}
                  </div>
                  <div className="text-xs text-slate-400 capitalize">{detail.risk_level} Risk Tier</div>
                </div>
              </div>

              {detail.intelligence && (
                <Card className="border-violet-900/50 bg-violet-950/20">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-white">Customer Intelligence & Explainable AI</CardTitle></CardHeader>
                  <CardContent className="grid gap-3 text-sm md:grid-cols-4">
                    <div><span className="text-slate-400">Confidence</span><p className="font-bold text-violet-300">{detail.intelligence.recovery_confidence_score}%</p></div>
                    <div><span className="text-slate-400">Sentiment</span><p className="font-bold capitalize text-emerald-300">{detail.intelligence.sentiment}{detail.intelligence.sentiment_score != null ? ` (${detail.intelligence.sentiment_score})` : ""}</p></div>
                    <div><span className="text-slate-400">Churn risk</span><p className="font-bold capitalize text-amber-300">{detail.intelligence.churn_risk}{detail.intelligence.churn_risk_score != null ? ` (${detail.intelligence.churn_risk_score})` : ""}</p><p className="text-xs text-slate-400 mt-1">Reco: {detail.intelligence.recommended_channel ?? "—"}</p></div>
                    <div><span className="text-slate-400">Why this prediction</span><ul className="mt-1 list-disc pl-4 text-xs text-slate-300">{detail.intelligence.explanation.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
                  </CardContent>
                  {detail.intelligence.payment_reconciliation && detail.intelligence.payment_reconciliation.length > 0 && (
                    <CardContent className="pt-0 text-xs text-slate-300">
                      <p className="mb-1 font-semibold text-slate-400">Payment reconciliation ({detail.intelligence.payment_reconciliation.length})</p>
                      {detail.intelligence.payment_reconciliation.slice(0, 3).map((r) => (
                        <p key={r.link_id} className="font-mono truncate">{r.link_id} • {r.status} • {r.amount}</p>
                      ))}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Action Trigger Box: Run Recovery Agent */}
              <Card className="bg-gradient-to-br from-blue-950/30 via-slate-900/60 to-slate-900 border-blue-900/40 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                      <CardTitle className="text-sm text-white font-bold">
                        Autonomous Recovery AI Trigger
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="border-blue-500/30 text-blue-300 text-[11px]">
                      LangGraph 8-Agent Flow
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    Runs Risk Detection → XGBoost Prediction → Sentiment/Churn → Recommendation/Timing → Gemini Channel Selection → Razorpay Payment Link → Gemini Messaging → PostgreSQL Tracking.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-slate-300">Outreach Tone:</span>
                      <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
                        {["friendly", "professional", "hinglish", "formal"].map((tone) => (
                          <button
                            key={tone}
                            onClick={() => setAgentTone(tone)}
                            className={`px-2.5 py-1 text-xs rounded-md capitalize transition-colors ${
                              agentTone === tone
                                ? "bg-blue-600 text-white font-semibold"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleRunAgent}
                      disabled={runningAgent}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 h-9 shadow-md shadow-blue-600/25"
                    >
                      <Zap className={`h-3.5 w-3.5 mr-1.5 ${runningAgent ? "animate-spin" : ""}`} />
                      {runningAgent ? "Orchestrating Agents..." : "Run Recovery Agent"}
                    </Button>
                  </div>

                  {/* Real outreach: email + voice */}
                  <div className="pt-3 border-t border-slate-800/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="recipient email"
                        className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500"
                      />
                      <Button
                        onClick={handleSendEmail}
                        disabled={emailBusy}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
                      >
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                        {emailBusy ? "Sending…" : "Send real email"}
                      </Button>
                    </div>
                    {emailMsg && <p className="text-[11px] text-slate-400 font-mono">{emailMsg}</p>}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
                        {["EN", "Hinglish"].map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setVoiceLang(lang)}
                            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                              voiceLang === lang
                                ? "bg-emerald-600 text-white font-semibold"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                      <Button
                        onClick={handleVoice}
                        disabled={voiceBusy}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
                      >
                        <Phone className="h-3.5 w-3.5 mr-1.5" />
                        {voiceBusy ? "Logging…" : "Hear + log voice call"}
                      </Button>
                      {voiceScript && (
                        <Button
                          onClick={() => speak(voiceScript, voiceLang)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
                        >
                          Replay audio
                        </Button>
                      )}
                    </div>
                    {voiceScript && (
                      <p className="text-[11px] text-slate-400 font-mono leading-relaxed border-l-2 border-emerald-500/50 pl-2">
                        {voiceScript}
                      </p>
                    )}
                  </div>

                  {/* Agent Output Reveal */}
                  {agentResult && (
                    <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-blue-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Agent Pipeline Executed Successfully!</span>
                        </div>
                        <Badge variant="success" className="text-[11px] capitalize">
                          Channel: {agentResult.channel}
                        </Badge>
                      </div>

                      <div className="text-xs bg-slate-900 p-3 rounded border border-slate-800 text-slate-200 leading-relaxed font-mono">
                        {agentResult.message}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center space-x-2 text-slate-400 truncate max-w-md">
                          <span className="font-semibold text-slate-300">Payment Link:</span>
                          {agentResult.payment_link ? (
                            <span className="text-blue-400 truncate">{agentResult.payment_link}</span>
                          ) : (
                            <span className="text-amber-300">Pending — Razorpay unreachable/unconfigured, tracked without link.</span>
                          )}
                        </div>

                        {agentResult.payment_link && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(agentResult.payment_link)}
                            className="h-7 text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {copiedLink ? "Copied!" : "Copy"}
                          </Button>
                          <a href={agentResult.payment_link} target="_blank" rel="noreferrer">
                            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open Link
                            </Button>
                          </a>
                        </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action History Timeline */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Outreach & Recovery Action Timeline ({detail.actions.length})</span>
                </h3>

                {detail.actions.length === 0 ? (
                  <div className="text-xs text-slate-500 p-4 border border-dashed border-slate-800 rounded-lg text-center">
                    No outreach actions recorded yet. Run the agent above to initiate recovery.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.actions.map((act) => (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="capitalize font-semibold text-[11px] border-slate-700">
                              {act.channel || "Unknown"}
                            </Badge>
                            <Badge
                              variant={
                                act.action_status === "paid"
                                  ? "success"
                                  : act.action_status === "failed"
                                  ? "destructive"
                                  : "warning"
                              }
                              className="text-[10px] capitalize"
                            >
                              {act.action_status}
                            </Badge>
                            <span className="text-[11px] text-slate-500">
                              {new Date(act.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                            {act.message_content}
                          </p>
                          {(act.template || act.lang || act.cost_paise != null) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-[10px] text-slate-500">
                              {act.template && <span className="px-1.5 py-0.5 rounded border border-slate-800">{act.template}</span>}
                              {act.lang && (
                                <span className="px-1.5 py-0.5 rounded-full border border-emerald-900/60 text-emerald-300">{act.lang}</span>
                              )}
                              {act.cost_paise != null && <span>₹{(act.cost_paise / 100).toFixed(2)}</span>}
                            </div>
                          )}
                        </div>

                        {act.payment_link && (
                          <a href={act.payment_link} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className="h-7 text-xs border-slate-800 text-blue-400 hover:bg-slate-800">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Pay Link
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Logs Trail */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  <span>State Machine Audit Log Trail ({detail.audit_logs.length})</span>
                </h3>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {detail.audit_logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded bg-slate-900/30 border border-slate-800/60 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-blue-400 font-semibold">{log.actor}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-300 font-medium">{log.action}</span>
                      </div>
                      <span className="text-slate-500 font-mono">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-slate-900/60 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="border-slate-800 text-xs text-slate-300">
            Close Dossier
          </Button>
        </div>
      </div>
    </div>
  );
}
