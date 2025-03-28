"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";

import type { AppRouter } from "~/server/api/root";

// Create tRPC React hooks
export const api = createTRPCReact<AppRouter>();

// TRPCProvider component for client components
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => 
    api.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          headers() {
            return {
              "x-trpc-source": "react-client",
            };
          },
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
} 