import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 text-center max-w-4xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/30 bg-emerald-950/40 text-emerald-300 py-1 px-3 font-mono text-[11px]">
              Track 03 · RecoverAI · the return
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
              Most recovery attempts
              <br />
              <span className="text-emerald-400 underline decoration-emerald-500/50 underline-offset-8">destroy value</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 mb-4 leading-relaxed max-w-2xl mx-auto">
              Every outreach costs money whether it works or not. RecoverAI decides{" "}
              <span className="text-slate-200">what</span> to try,{" "}
              <span className="text-slate-200">when</span>, and on which channel — and most of
              the time it decides <span className="text-white font-semibold">not to act at all</span>,
              with the arithmetic recorded beside every refusal.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-sm my-8">
              <span className="px-3 py-1 rounded-lg border border-cyan-500/40 text-cyan-300">probability</span>
              <span className="text-slate-500">×</span>
              <span className="px-3 py-1 rounded-lg border border-emerald-500/40 text-emerald-300">(amount × margin)</span>
              <span className="text-slate-500">−</span>
              <span className="px-3 py-1 rounded-lg border border-rose-500/40 text-rose-300">cost</span>
              <span className="text-slate-400 text-lg">≥</span>
              <span className="px-3 py-1 rounded-lg border border-amber-500/40 text-amber-300">floor</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-12 shadow-lg shadow-emerald-600/25 text-sm">
                  Open Recovery Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/cases">
                <Button size="lg" variant="outline" className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 h-12 px-6 text-sm">
                  <Layers className="mr-2 h-4 w-4 text-emerald-400" />
                  Explore 5,000+ Cases
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 8-step engine grid */}
        <section className="container mx-auto px-4 sm:px-6 pb-20 max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">
            One engine · detect to stop
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-6">Eight steps, one refusal-first pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-md">
              <CardHeader>
                <p className="font-mono text-[11px] text-emerald-400 tracking-widest">01 · DETECT</p>
                <CardTitle className="text-white text-base">Watch the whole book</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Every failed payment, abandoned checkout, and overdue invoice becomes a recovery case with amount, cause, and history attached.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-md">
              <CardHeader>
                <p className="font-mono text-[11px] text-emerald-400 tracking-widest">02 · PREDICT</p>
                <CardTitle className="text-white text-base">Read the failure</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  XGBoost scores recovery probability (66.9% accuracy, 0.681 AUC) while sentiment analysis prices churn risk — no action below calibrated confidence.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-md">
              <CardHeader>
                <p className="font-mono text-[11px] text-emerald-400 tracking-widest">03 · PRICE</p>
                <CardTitle className="text-white text-base">Cost it out</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Multiply probability by margin at stake, subtract the fee — all in integer paise. A ₹4 lakh invoice at 8% margin can be worth less than a small subscription.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-md">
              <CardHeader>
                <p className="font-mono text-[11px] text-emerald-400 tracking-widest">04 · DECIDE</p>
                <CardTitle className="text-white text-base">Usually, refuse</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Quiet hours, cooldowns, attempt caps, then the floor. Whatever the answer, the arithmetic and the rule are written to the audit trail.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-md">
              <CardHeader>
                <p className="font-mono text-[11px] text-emerald-400 tracking-widest">05 · EXECUTE</p>
                <CardTitle className="text-white text-base">Act, once</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  A real Razorpay test-mode payment link, a real Gmail email, a logged voice call from a registered template — keyed idempotently, never twice.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-md">
              <CardHeader>
                <p className="font-mono text-[11px] text-emerald-400 tracking-widest">06 · STOP</p>
                <CardTitle className="text-white text-base">And know when to</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  No maxAttempts constant doing the real work: a sequence ends when expected value crosses the floor. Webhook receipts close the loop.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6">
        <div className="container mx-auto px-4 text-center text-xs text-slate-500">
          RecoverAI — Autonomous Revenue Recovery Platform • Days 1 to 8 Complete
        </div>
      </footer>
    </div>
  );
}
