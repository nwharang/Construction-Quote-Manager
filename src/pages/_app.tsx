import '@/styles/globals.css';
import React from 'react';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { SidebarComponent } from '@/components/SidebarComponent';
import { NavBar } from '@/components/NavBar';
import { api } from '~/utils/api';
import { SettingsProvider } from '~/contexts/settings-context';
import { QuotesProvider } from '~/contexts/QuotesContext';
import { LocalizationProvider } from '~/contexts/LocalizationContext';
import { CustomersProvider } from '~/contexts/CustomersContext';
import { ProductsProvider } from '~/contexts/ProductsContext';

function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <SettingsProvider>
        <LocalizationProvider>
          <ThemeProvider>
            <HeroUIProvider>
              <ToastProvider>
                <QuotesProvider>
                  <CustomersProvider>
                    <ProductsProvider>
                      <div className="flex h-screen divide-x-1 divide-foreground/5">
                        <SidebarComponent />
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <NavBar />
                          <main className="flex-1 overflow-auto p-4">
                            <Component {...pageProps} />
                          </main>
                        </div>
                      </div>
                    </ProductsProvider>
                  </CustomersProvider>
                </QuotesProvider>
              </ToastProvider>
            </HeroUIProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </SettingsProvider>
    </SessionProvider>
  );
}

// Wrap the App with tRPC
export default api.withTRPC(App);
