import Link from "next/link";
import { ArrowRight, Bot, Cpu, Database, Layers, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
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
            <Badge variant="outline" className="mb-4 border-blue-500/30 bg-blue-950/40 text-blue-300 py-1 px-3">
              <Zap className="mr-1.5 h-3.5 w-3.5 text-blue-400" />
              Autonomous Revenue Leakage Recovery Platform
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
              RecoverAI
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 mb-8 leading-relaxed max-w-2xl mx-auto">
              Autonomously detect revenue leakage, forecast recovery probability with ML, and orchestrate
              personalized, multi-channel outreach to win back money with real-time ROI tracking.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 shadow-lg shadow-blue-600/25 text-sm">
                  Open Recovery Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/cases">
                <Button size="lg" variant="outline" className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 h-12 px-6 text-sm">
                  <Layers className="mr-2 h-4 w-4 text-blue-400" />
                  Explore 5,000+ Cases
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="container mx-auto px-4 sm:px-6 pb-20 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-md">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 mb-2">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <CardTitle className="text-white text-base">XGBoost Recovery Prediction</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Trained machine learning model calculating real-time recovery likelihood (66.9% accuracy, 0.681 AUC) across customer tenure and risk attributes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-md">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 mb-2">
                  <Bot className="h-5 w-5" />
                </div>
                <CardTitle className="text-white text-base">LangGraph 8-Agent Flow</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  State machine chaining Risk Detection → ML Prediction → Sentiment/Churn → Recommendation → Gemini Channel Selection → Razorpay Payment Retry → Gemini Copywriting → Tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-md">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-white text-base">Razorpay Test Integration</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Generates instant, secure test-mode payment links interpolated server-side to prevent LLM URL hallucinations.
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
