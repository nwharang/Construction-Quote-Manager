"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

interface LayoutClientWrapperProps {
  children: React.ReactNode;
  session: Session | null;
}

export function LayoutClientWrapper({
  children,
  session,
}: LayoutClientWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <SessionProvider session={session}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <NextUIProvider>
          <div className="flex flex-col min-h-screen bg-background">
            <header className="fixed top-0 left-0 right-0 z-40">
              <Navbar onSidebarOpen={() => setSidebarOpen(true)} />
            </header>
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)} 
            />
            <main className="flex-1 container mx-auto px-4 py-6 mt-16">
              {children}
            </main>
          </div>
        </NextUIProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
} 