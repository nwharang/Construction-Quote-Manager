import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useRouter } from 'next/router';
import { NextUIProvider } from '@nextui-org/react';
import { Toaster } from 'sonner';
import { Layout } from '../components/layout';
import { LoadingSpinner } from '../components/loading';

function SafeHydrate({ children }: { children: React.ReactNode }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  );
}

// Component to handle client-side only rendering
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return <>{children}</>;
}

// Handle tRPC errors gracefully
const TRPCWrapper = ({ children }: { children: React.ReactNode }) => {
  try {
    const { TRPCReactProvider } = require('../trpc/react');
    return <TRPCReactProvider>{children}</TRPCReactProvider>;
  } catch (error) {
    console.error('Error loading tRPC provider:', error);
    return <>{children}</>;
  }
};

export default function App({ Component, pageProps }: AppProps) {
  const { session, ...otherPageProps } = pageProps;
  const router = useRouter();
  const isAuthPage = router.pathname.startsWith('/auth/');
  const [loading, setLoading] = useState(true);
  
  // Initialize theme on client side
  useEffect(() => {
    setLoading(false);
    
    // Initialize theme from localStorage if available
    try {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Error initializing theme:', e);
    }
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[rgba(var(--background-start-rgb),0.95)]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <SessionProvider session={session}>
      <SafeHydrate>
        <TRPCWrapper>
          <ThemeProvider attribute="class">
            <NextUIProvider>
              <ClientOnly>
                <Toaster position="top-right" richColors />
              </ClientOnly>
              
              {isAuthPage ? (
                <Component {...otherPageProps} />
              ) : (
                <Layout>
                  <Component {...otherPageProps} />
                </Layout>
              )}
            </NextUIProvider>
          </ThemeProvider>
        </TRPCWrapper>
      </SafeHydrate>
    </SessionProvider>
  );
} 