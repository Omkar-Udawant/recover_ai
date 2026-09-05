"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers, XCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const [simAmount, setSimAmount] = useState<number>(4500);
  const [simProb, setSimProb] = useState<number>(68);
  const [simCost, setSimCost] = useState<number>(180);
  const margin = 0.70;
  const floorInr = 45;

  const grossRecoverable = simAmount * margin;
  const expectedValue = (simProb / 100) * grossRecoverable - simCost;
  const passesGate = expectedValue >= floorInr;

  const stages = [
    {
      id: "01",
      tag: "DETECT",
      title: "Ledger Ingestion and Audit",
      desc: "Ingests failed payments, abandoned transactions, and invoice events into an immutable PostgreSQL audit ledger.",
    },
    {
      id: "02",
      tag: "PREDICT",
      title: "Calibrated Risk Scoring",
      desc: "XGBoost tabular classifier outputs calibrated recovery probabilities based on tenure, volume, and past defaults.",
    },
    {
      id: "03",
      tag: "PRICE",
      title: "Margin and EV Pricing",
      desc: "Computes contribution margin in integer paise. Subtracts channel tolls to derive rigorous expected recovery return.",
    },
    {
      id: "04",
      tag: "DECIDE",
      title: "Autonomous Policy Gate",
      desc: "Evaluates cooldown windows, rolling 30-day attempt caps, and IST quiet hours before authorizing action.",
    },
    {
      id: "05",
      tag: "EXECUTE",
      title: "Multi-Channel Dispatch",
      desc: "Generates idempotent Razorpay payment links, Gemini personalized emails, and Hinglish telephony scripts.",
    },
    {
      id: "06",
      tag: "STOP",
      title: "Mathematical Stopping Rule",
      desc: "Calculates optimal stopping threshold: outreach sequence halts automatically when expected value inverts.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:text-emerald-300 font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Technical Hero Header */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 text-center max-w-4xl">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6">
              <Badge variant="settled" className="text-[11px] py-1 px-2.5">
                Track 03 · Autonomous Revenue Recovery Agent
              </Badge>
              <Badge variant="secondary" className="hidden sm:inline-flex text-[11px] py-1 px-2.5">
                Calibrated XGBoost &amp; Integer Paise Engine
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6 font-sans">
              Most recovery attempts
              <br />
              <span className="text-emerald-600 dark:text-emerald-400">destroy economic value.</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto font-sans">
              Every customer outreach costs capital whether it converts or churns. RecoverAI models
              calibrated recovery probabilities, contribution margin, and strict quiet-hours rules
              before dispatching an intervention — and refuses to act when expected return is below the floor.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/dashboard">
                <Button size="lg" className="font-mono text-xs px-6 h-11">
                  Launch Recovery Terminal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/cases">
                <Button size="lg" variant="outline" className="font-mono text-xs px-6 h-11 border-border">
                  <Layers className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Explore 5,003 Cases
                </Button>
              </Link>
            </div>

            {/* Quick Metrics Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-border text-left font-mono">
              <div className="p-3 rounded-[4px] border border-border bg-card">
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider">ML Accuracy</div>
                <div className="text-xl font-bold text-foreground mt-0.5 tabular-nums">66.91%</div>
                <div className="text-[10px] text-muted-foreground">0.681 ROC-AUC</div>
              </div>
              <div className="p-3 rounded-[4px] border border-border bg-card">
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Revenue Recovered</div>
                <div className="text-xl font-bold text-foreground mt-0.5 tabular-nums">₹96.02 Lakhs</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400">55.0% Win Rate</div>
              </div>
              <div className="p-3 rounded-[4px] border border-border bg-card">
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Total Pipeline</div>
                <div className="text-xl font-bold text-foreground mt-0.5 tabular-nums">5,003 Cases</div>
                <div className="text-[10px] text-muted-foreground">₹1.80 Cr Evaluated</div>
              </div>
              <div className="p-3 rounded-[4px] border border-border bg-card">
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Money Arithmetic</div>
                <div className="text-xl font-bold text-foreground mt-0.5">Zero Float</div>
                <div className="text-[10px] text-muted-foreground">Integer Paise Ledger</div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Mathematical Expected-Value Gate Simulator */}
        <section className="py-16 bg-secondary/30 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <div className="mb-8 text-center max-w-2xl mx-auto">
              <Badge variant="inflight" className="mb-2 font-mono text-[10px]">
                Live Mathematical Gate Playground
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
                The Expected-Value Invariant
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed font-mono">
                Test the exact formula that governs all 8 agents in real time. Adjust invoice size,
                predicted probability, and channel toll to see how RecoverAI prevents value destruction.
              </p>
            </div>

            <Card className="p-6 md:p-8 bg-card border-border">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Sliders column */}
                <div className="md:col-span-7 space-y-5">
                  {/* Amount Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-muted-foreground">Invoice Amount</span>
                      <span className="font-bold text-foreground tabular-nums">₹{simAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={25000}
                      step={250}
                      value={simAmount}
                      onChange={(e) => setSimAmount(Number(e.target.value))}
                      className="w-full accent-emerald-600 h-1.5 bg-secondary rounded cursor-pointer"
                    />
                  </div>

                  {/* Probability Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-muted-foreground">XGBoost Recovery Probability</span>
                      <span className="font-bold text-foreground tabular-nums">{simProb}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={95}
                      step={1}
                      value={simProb}
                      onChange={(e) => setSimProb(Number(e.target.value))}
                      className="w-full accent-emerald-600 h-1.5 bg-secondary rounded cursor-pointer"
                    />
                  </div>

                  {/* Channel Cost Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-muted-foreground">Outreach Cost (Channel Toll)</span>
                      <span className="font-bold text-foreground tabular-nums">₹{simCost.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={500}
                      step={5}
                      value={simCost}
                      onChange={(e) => setSimCost(Number(e.target.value))}
                      className="w-full accent-emerald-600 h-1.5 bg-secondary rounded cursor-pointer"
                    />
                  </div>

                  {/* Formula Breakdown Callout */}
                  <div className="p-3 rounded-[4px] bg-secondary/50 border border-border font-mono text-[11px] text-muted-foreground space-y-1">
                    <div>Gross at Stake: ₹{simAmount} × 70% Margin = ₹{grossRecoverable.toFixed(2)}</div>
                    <div>Calculation: ({simProb}% × ₹{grossRecoverable.toFixed(2)}) − ₹{simCost.toFixed(2)} = ₹{expectedValue.toFixed(2)}</div>
                    <div>Required Threshold: Expected Value ≥ ₹{floorInr}.00 Floor</div>
                  </div>
                </div>

                {/* Outcome Display Card */}
                <div className="md:col-span-5 p-6 rounded-[6px] border border-border bg-secondary/30 text-center space-y-4">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Expected Net Return
                  </div>
                  <div className="text-4xl font-extrabold font-mono tracking-tight text-foreground tabular-nums">
                    ₹{expectedValue.toFixed(2)}
                  </div>

                  <div className="flex justify-center">
                    {passesGate ? (
                      <Badge variant="settled" className="py-1 px-3 text-xs font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Gate Cleared · Dispatch Authorized
                      </Badge>
                    ) : (
                      <Badge variant="refused" className="py-1 px-3 text-xs font-semibold">
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Gate Refusal · Value Destroying
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    {passesGate
                      ? "Positive expected return confirmed. Outbound Razorpay payment link and communication authorized."
                      : "Refused at mathematical boundary. Outreach suppressed to prevent value destruction and preserve merchant margin."}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 6-Stage Multi-Agent Architecture */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <Badge variant="secondary" className="mb-2 font-mono text-[10px]">
                Directed Acyclic Graph Architecture
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
                Eight Stages, One Refusal-First Pipeline
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed font-mono">
                Stateful orchestration across PostgreSQL ledger, XGBoost scoring, and Google Gemini reasoning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stages.map((step) => (
                <Card key={step.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      STAGE {step.id}
                    </span>
                    <span className="font-mono text-[10px] rounded-[3px] border border-border bg-secondary/50 px-1.5 py-0.5 text-foreground">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight font-sans">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Clean Technical Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-xs font-mono text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl">
          <div>RecoverAI · Autonomous Revenue Recovery Platform</div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Terminal</Link>
            <Link href="/cases" className="hover:text-foreground transition-colors">Case Ledger</Link>
            <Link href="/policy" className="hover:text-foreground transition-colors">Guardrails</Link>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}