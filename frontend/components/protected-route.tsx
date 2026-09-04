"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login"); else setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login"); else setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);
  if (!ready) return <main className="min-h-screen bg-slate-950 grid place-items-center text-slate-300">Loading secure session…</main>;
  return <>{children}</>;
}
