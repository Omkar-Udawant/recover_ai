import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecoverAI — Autonomous AI Revenue Recovery Agent",
  description:
    "Autonomous revenue leakage recovery platform orchestrating multi-agent AI and predictive intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
