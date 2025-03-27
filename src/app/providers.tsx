"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { api } from "~/utils/api";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import superjson from "superjson";
import { SimpleHeader } from "../components/simple-header";
import { Sidebar } from "../components/sidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    })
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SessionProvider>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <NextUIProvider>
            <NextThemesProvider defaultTheme="dark">
              <div className="relative flex min-h-screen flex-col bg-background">
                <SimpleHeader onSidebarOpen={() => setSidebarOpen(true)} />
                <Sidebar 
                  isOpen={sidebarOpen} 
                  onClose={() => setSidebarOpen(false)} 
                />
                <main className="flex-1 container mx-auto px-4 py-6 pt-16" role="main">
                  {children}
                </main>
                <footer className="border-t border-divider py-4">
                  <div className="container mx-auto px-4 text-center text-sm text-default-500">
                    <p>&copy; {new Date().getFullYear()} Construction Quote Manager. All rights reserved.</p>
                  </div>
                </footer>
              </div>
            </NextThemesProvider>
          </NextUIProvider>
        </QueryClientProvider>
      </api.Provider>
    </SessionProvider>
  );
} 