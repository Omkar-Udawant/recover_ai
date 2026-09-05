"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30 seconds
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: "#0E1117",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#F1F5F9",
            borderRadius: "0.75rem",
            boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
