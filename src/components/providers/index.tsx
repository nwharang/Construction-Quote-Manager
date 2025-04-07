import React from 'react';
import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { HeroUIProvider, Spinner } from '@heroui/react';
import { ToastContainer } from '~/components/shared/ToastContainer';
import { I18nProvider } from './I18nProvider';
import { ThemeProvider } from './ThemeProvider';
import { ConfigLoader } from './ConfigLoader';
import { useConfigStore } from '~/store';
import type { Session } from 'next-auth';
import { useRouter } from 'next/router';

interface ProvidersProps {
  children: ReactNode;
  session?: Session | null;
}

/**
 * Component to render main content or loading state
 */
function AppContent({ children }: { children: ReactNode }) {
  const isLoading = useConfigStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Render children once loading is complete
  return <>{children}</>;
}

/**
 * HeroUI provider with Next.js Pages router integration
 */
function HeroUIWithRouting({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider
      navigate={(path) => router.push(path)}
      useHref={(href) => href}
      labelPlacement="outside"
    >
      {children}
    </HeroUIProvider>
  );
}

/**
 * Centralized providers component for the application
 * Wraps the application with all necessary providers
 */
export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ConfigLoader />
      <ThemeProvider>
        <HeroUIWithRouting>
          <AppContent>
            <I18nProvider>
              <ToastContainer />
              {children}
            </I18nProvider>
          </AppContent>
        </HeroUIWithRouting>
      </ThemeProvider>
    </SessionProvider>
  );
}

// Re-export all providers for direct imports
export * from './I18nProvider';
