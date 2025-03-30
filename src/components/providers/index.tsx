import React from 'react';
import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { HeroUIProvider } from '@heroui/react';
import { ToastContainer } from '~/components/shared/ToastContainer';
import { LanguageMetaData } from '~/components/accessibility/LanguageMetaData';
import { I18nProvider } from './I18nProvider';

interface ProvidersProps {
  children: ReactNode;
  session?: any;
}

/**
 * Centralized providers component for the application
 * Wraps the application with all necessary providers
 */
export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <HeroUIProvider>
        <I18nProvider>
          <LanguageMetaData />
          <ToastContainer />
          {children}
        </I18nProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}

export default Providers;

// Re-export all providers for direct imports
export * from './I18nProvider';
