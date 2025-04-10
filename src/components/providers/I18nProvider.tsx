import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useConfigStore } from '~/store/configStore';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Cookies from 'js-cookie';
import {
  type AppLocale,
  type LocalesMap,
  locales,
  DEFAULT_LOCALE,
  isSupportedLocale,
} from '~/i18n/locales';

// --- Context Definition ---
interface I18nContextType {
  changeLocale: (newLocale: AppLocale) => void;
  currentLocale: AppLocale;
  availableLocales: LocalesMap;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// --- Provider Component ---
interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const router = useRouter();
  const { settings, setSettings: setStoreSettings } = useConfigStore();
  const { data: session } = useSession();

  // Minimal render log if needed, removed the verbose one
  // console.log(`[I18nProvider] Render. Store: ${settings?.locale}, Router: ${router.locale}`);

  const changeLocale = useCallback(
    (newLocale: AppLocale) => {
      // Removed internal changeLocale logs
      const currentStoreLocale = settings?.locale;
      if (currentStoreLocale === newLocale) {
        return;
      }

      setStoreSettings({ locale: newLocale });

      if (router.locale !== newLocale) {
        router
          .push(router.pathname, router.asPath, { locale: newLocale, scroll: false })
          .catch((error) => {
             console.error(`[I18nProvider] router.push failed:`, error); // Keep error log
          });
      } // Removed else block with log

      if (typeof window !== 'undefined') {
        const localeCookieKey = 'app-locale';
        // Removed persistence log
        localStorage.setItem('locale', newLocale);
        Cookies.set(localeCookieKey, newLocale, { expires: 365 });
      }
      // Removed finished log
    },
    [setStoreSettings, settings?.locale, router]
  );

  // Removed Storage Sync Effect logs
  useEffect(() => {
    if (!session && !useConfigStore.getState().isLoading && router.pathname.includes('/auth/')) {
      const localeCookieKey = 'app-locale';
      const storedLocale = Cookies.get(localeCookieKey) || localStorage.getItem('locale');

      if (storedLocale && isSupportedLocale(storedLocale)) {
        const appLocale = storedLocale as AppLocale;
        const currentStoreLocale = settings?.locale;

        if (!currentStoreLocale || currentStoreLocale !== appLocale) {
          setStoreSettings({ locale: appLocale });
        }

        if (router.locale !== appLocale) {
          router.replace(router.pathname, router.asPath, { locale: appLocale, scroll: false })
            .catch(err => console.error('[I18nProvider Storage Sync Effect] Router sync from storage failed:', err)); // Keep error log
        }
      }
    }
  }, [router.pathname, router.asPath, session, settings?.locale, setStoreSettings]);

  // Removed Lang Attr Effect logs
  useEffect(() => {
    const currentLocale = settings?.locale || DEFAULT_LOCALE;
    if (typeof document !== 'undefined') {
       if (document.documentElement.lang !== currentLocale) {
          document.documentElement.lang = currentLocale;
       }
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [settings?.locale]);

  const value = useMemo(
    () => {
      // Removed context recalculation log
      return {
      changeLocale,
      currentLocale: (settings?.locale as AppLocale) ?? DEFAULT_LOCALE,
      availableLocales: locales,
      };
    },
    [settings?.locale, changeLocale]
  );

  return (
    <I18nContext.Provider value={value}>
      <Head>
        <meta httpEquiv="content-language" content={value.currentLocale} />
      </Head>
      {children}
    </I18nContext.Provider>
  );
}

// --- Hook ---
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
