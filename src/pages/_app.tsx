import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Layout } from '../components/layout';
import { HeroUIProvider, Spinner } from '@heroui/react';
import { type AppProps } from 'next/app';
import { type Session } from 'next-auth';
import { api } from '~/utils/api';
import { SettingsProvider } from '~/contexts/settings-context';
import { ThemeProvider } from '~/components/providers/ThemeProvider';
import { ToastProvider } from '~/components/providers/ToastProvider';
import { LocalizationProvider } from '~/contexts/LocalizationContext';
import Head from 'next/head';

// Use the built-in AppProps type with Session
type AppPropsWithSession = AppProps<{ session: Session | null }>;

const MyApp = ({ Component, pageProps: { session, ...pageProps } }: AppPropsWithSession) => {
  const router = useRouter();
  const isAuthPage = router.pathname.startsWith('/auth/');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize app and hide loading spinner
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <HeroUIProvider>
        <div className="flex h-screen w-full justify-center items-center">
          <Spinner size="lg" />
        </div>
      </HeroUIProvider>
    );
  }

  return (
    <SessionProvider session={session}>
      <SettingsProvider>
        <ThemeProvider>
          <LocalizationProvider>
            <HeroUIProvider>
              <ToastProvider>
                {isAuthPage ? (
                  <Component {...pageProps} />
                ) : (
                  <Layout>
                    <Component {...pageProps} />
                  </Layout>
                )}
              </ToastProvider>
            </HeroUIProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
