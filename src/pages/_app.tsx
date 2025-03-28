import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useRouter } from 'next/router';
import { Layout } from '../components/layout';
import { HeroUIProvider, Spinner, Toast } from '@heroui/react';
import { type AppType } from 'next/app';
import { type Session } from 'next-auth';
import { api } from '~/utils/api';
import { SettingsProvider } from '~/contexts/settings-context';

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();
  const isAuthPage = router.pathname.startsWith('/auth/');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <HeroUIProvider>
        <div className="flex justify-center items-center">
          <Spinner />
        </div>
      </HeroUIProvider>
    );
  }

  return (
    <SessionProvider session={session}>
      <SettingsProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <HeroUIProvider>
            {isAuthPage ? (
              <Component {...pageProps} />
            ) : (
              <Layout>
                <Component {...pageProps} />
              </Layout>
            )}
          </HeroUIProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
