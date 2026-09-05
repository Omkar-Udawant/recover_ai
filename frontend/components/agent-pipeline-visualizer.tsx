"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Cpu,
  Mail,
  MessageSquare,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AgentRunResponse } from "@/lib/types";

interface AgentPipelineVisualizerProps {
  result: AgentRunResponse | null;
  isRunning: boolean;
  selectedTone?: string;
  onToneChange?: (tone: string) => void;
}

interface StageDefinition {
  id: number;
  name: string;
  subhead: string;
  icon: React.ElementType;
  estLatency: string;
  description: string;
}

const STAGES: StageDefinition[] = [
  {
    id: 1,
    name: "Risk Triage",
    subhead: "Rule-based triage categorization",
    icon: ShieldAlert,
    estLatency: "1.2ms",
    description: "Evaluates overdue days, failed payment count, and initial amount threshold into Risk Tiers.",
  },
  {
    id: 2,
    name: "XGBoost ML Inference",
    subhead: "Tabular recovery prediction",
    icon: Cpu,
    estLatency: "4.8ms",
    description: "Evaluates 12 customer engagement & transaction features to output calibrated recovery probability.",
  },
  {
    id: 3,
    name: "Policy Guardrail",
    subhead: "Wapsi expected-value margin gate",
    icon: ShieldCheck,
    estLatency: "0.8ms",
    description: "Applies formula: p × amount × margin − cost ≥ floor. Refuses wasteful outreach.",
  },
  {
    id: 4,
    name: "Sentiment & Churn",
    subhead: "Deterministic customer engagement",
    icon: Shield,
    estLatency: "2.1ms",
    description: "Calculates historical loyalty index and risk of churn based on days overdue.",
  },
  {
    id: 5,
    name: "Channel Selection",
    subhead: "Conversion-optimized routing",
    icon: MessageSquare,
    estLatency: "3.5ms",
    description: "Selects optimal outreach medium (WhatsApp, Email, SMS, or Voice Call).",
  },
  {
    id: 6,
    name: "Payment Retry Gateway",
    subhead: "Razorpay test-mode link",
    icon: Zap,
    estLatency: "185ms",
    description: "Mints traceable payment URL. Honest pending status when unconfigured.",
  },
  {
    id: 7,
    name: "Gemini Copywriting",
    subhead: "Personalized tone adaptation",
    icon: Sparkles,
    estLatency: "320ms",
    description: "Drafts tailored message across Professional, Friendly, Hinglish, or Formal tones.",
  },
  {
    id: 8,
    name: "Audit & Persistence",
    subhead: "PostgreSQL state sync",
    icon: Clock,
    estLatency: "6.4ms",
    description: "Persists action records, telemetry, and case state transition atomically.",
  },
];

export function AgentPipelineVisualizer({
  result,
  isRunning,
  selectedTone = "friendly",
  onToneChange,
}: AgentPipelineVisualizerProps) {
  const [activeStep, setActiveStep] = useState<number>(isRunning ? 1 : result ? 8 : 0);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isRunning) {
      setActiveStep(1);
      const interval = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= 8) {
            clearInterval(interval);
            return 8;
          }
          return prev + 1;
        });
      }, 250);
      return () => clearInterval(interval);
    } else if (result) {
      setActiveStep(8);
    }
  }, [isRunning, result]);

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Outreach message copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const channelIconMap: Record<string, React.ElementType> = {
    whatsapp: MessageSquare,
    email: Mail,
    sms: Phone,
    voice_call: Phone,
  };

  const ChannelIcon = result?.channel ? (channelIconMap[result.channel.toLowerCase()] || MessageSquare) : MessageSquare;

  return (
    <div className="space-y-4">
      {/* Visual Pipeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 swiss-card">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground tracking-wide uppercase">
              8-Agent LangGraph State Engine
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Autonomous risk triage, XGBoost inference, refusal guardrails & outreach
            </p>
          </div>
        </div>

        {result && (
          <div className="flex items-center space-x-2">
            <Badge
              variant={result.decision === "refused" ? "pastelAmber" : "pastelMint"}
              className="text-[11px] font-mono capitalize"
            >
              {result.decision === "refused" ? "Policy Refusal" : "Outreach Acted"}
            </Badge>
            <Badge variant="outline" className="text-[11px] font-mono border-border text-muted-foreground">
              Prob: {(result.recovery_probability * 100).toFixed(1)}%
            </Badge>
          </div>
        )}
      </div>

      {/* DAG Stepper Flow Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const isComplete = result ? true : activeStep > stage.id;
          const isCurrent = isRunning && activeStep === stage.id;
          const isRefusedHere = result?.decision === "refused" && stage.id === 3;

          return (
            <motion.div
              key={stage.id}
              whileHover={{ y: -1 }}
              onClick={() => setExpandedStep(expandedStep === stage.id ? null : stage.id)}
              className={`cursor-pointer relative p-2.5 rounded-lg border transition-all text-left ${
                isRefusedHere
                  ? "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300"
                  : isCurrent
                  ? "bg-sky-50 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500 text-sky-900 dark:text-sky-200 ring-1 ring-sky-400/40"
                  : isComplete
                  ? "bg-emerald-50/40 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-foreground"
                  : "bg-card border-border text-muted-foreground opacity-70"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                      isRefusedHere
                        ? "bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-300"
                        : isCurrent
                        ? "bg-sky-500 text-white animate-pulse"
                        : isComplete
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-3 w-3" /> : stage.id}
                  </div>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {stage.estLatency}
                </span>
              </div>

              <div className="text-[11px] font-semibold tracking-tight truncate text-foreground">
                {stage.name}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {stage.subhead}
              </div>

              {expandedStep === stage.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground leading-relaxed"
                >
                  {stage.description}
                  {stage.id === 2 && result && (
                    <div className="mt-1 font-mono text-emerald-700 dark:text-emerald-400">
                      Prediction: {(result.recovery_probability * 100).toFixed(1)}% | Tier: {result.risk_level}
                    </div>
                  )}
                  {stage.id === 3 && result && (
                    <div className="mt-1 font-mono text-amber-700 dark:text-amber-300">
                      Decision: {result.decision} {result.refusal_reason ? `(${result.refusal_reason})` : "✓ Cleared"}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Generated Message & Channel Output Card */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="swiss-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                <ChannelIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-foreground capitalize">
                    {result.channel} Outreach Engine
                  </span>
                  <Badge variant="outline" className="text-[10px] border-border text-muted-foreground capitalize">
                    {selectedTone} tone
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {result.channel_reason || "Selected via highest historical conversion trajectory"}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => copyMessage(result.message)}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {/* Typewriter message display */}
          <div className="p-3 rounded-md bg-secondary/40 border border-border font-sans text-xs text-foreground leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/20">
            {result.message}
          </div>

          {/* Payment Link status if present */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="text-muted-foreground">Razorpay Link:</span>
              {result.payment_link ? (
                <a
                  href={result.payment_link}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <span>{result.payment_link}</span>
                  <ExternalLink className="h-3 w-3 inline ml-0.5" />
                </a>
              ) : (
                <span className="font-mono text-muted-foreground">Pending (Live Razorpay test credentials not supplied)</span>
              )}
            </div>

            <span className="font-mono text-muted-foreground shrink-0">
              Case Status: <span className="text-foreground capitalize">{result.case_status}</span>
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
