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
 * Centralized providers component for the application
 * Wraps the application with all necessary providers
 */
export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ConfigLoader />
      <ThemeProvider>
        <HeroUIProvider>
          <AppContent>
            <I18nProvider>
              <ToastContainer />
              {children}
            </I18nProvider>
          </AppContent>
        </HeroUIProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

// Re-export all providers for direct imports
export * from './I18nProvider';
