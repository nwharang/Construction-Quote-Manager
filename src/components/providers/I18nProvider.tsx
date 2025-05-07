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
  localeDetailsMap,
} from '~/i18n/locales';
import { LOCALE_COOKIE_KEY } from '~/config/constants';

// --- Context Definition ---
interface I18nContextType {
  changeLocale: (newLocale: AppLocale) => void;
  currentLocale: AppLocale;
  availableLocales: typeof localeDetailsMap;
}

const I18nContext = createContext<I18nContextType | null>(null);

// --- Provider Component ---
interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const router = useRouter();
  const { settings, setSettings: setStoreSettings, isLoading } = useConfigStore();
  const { data: session } = useSession();

  // Determine the authoritative current locale for the context
  const authoritativeLocale = useMemo(() => {
    if (router.locale && isSupportedLocale(router.locale)) {
      return router.locale as AppLocale;
    }
    if (settings?.locale && isSupportedLocale(settings.locale)) {
      return settings.locale as AppLocale;
    }
    return DEFAULT_LOCALE;
  }, [router.locale, settings?.locale]);

  // Effect to synchronize store and cookie if router.locale is valid and differs from store
  useEffect(() => {
    if (router.locale && isSupportedLocale(router.locale)) {
      const urlLocale = router.locale as AppLocale;
      if (settings?.locale !== urlLocale) {
        setStoreSettings({ locale: urlLocale });
        if (typeof window !== 'undefined') {
          Cookies.set(LOCALE_COOKIE_KEY, urlLocale, { expires: 365 });
          localStorage.setItem('locale', urlLocale); 
        }
      }
    }
  }, [router.locale, settings?.locale, setStoreSettings]);

  const changeLocale = useCallback(
    (newLocale: AppLocale) => {
      if (authoritativeLocale === newLocale) {
        return;
      }
      setStoreSettings({ locale: newLocale });
      if (typeof window !== 'undefined') {
        Cookies.set(LOCALE_COOKIE_KEY, newLocale, { expires: 365 });
        localStorage.setItem('locale', newLocale);
      }
      if (router.locale !== newLocale) {
        router
          .push(router.pathname, router.asPath, { locale: newLocale, scroll: false })
          .catch((error) => {
            console.error(`[I18nProvider] router.push failed:`, error);
          });
      }
    },
    [setStoreSettings, router, authoritativeLocale]
  );

  // Storage Sync Effect for unauthenticated users on auth pages (Can be reviewed for redundancy)
  useEffect(() => {
    if (!session && !useConfigStore.getState().isLoading && router.pathname.includes('/auth/')) {
      const storedCookieLocale = Cookies.get(LOCALE_COOKIE_KEY);
      const storedLsLocale = localStorage.getItem('locale');
      let preferredStoredLocale: string | undefined = undefined;

      if (storedCookieLocale && isSupportedLocale(storedCookieLocale)) {
        preferredStoredLocale = storedCookieLocale;
      } else if (storedLsLocale && isSupportedLocale(storedLsLocale)) {
        preferredStoredLocale = storedLsLocale;
      }

      if (preferredStoredLocale) {
        const appLocale = preferredStoredLocale as AppLocale;
        // Only update store and router if it's different from the current authoritative (URL-driven) locale
        if (authoritativeLocale !== appLocale) {
            setStoreSettings({ locale: appLocale });
            // Only push to router if router.locale itself is not already this appLocale
            // This check avoids loops if authoritativeLocale is already reflecting router.locale
            if(router.locale !== appLocale) {
                 router
                .replace(router.pathname, router.asPath, { locale: appLocale, scroll: false })
                .catch((err) => console.error('[I18nProvider Storage Sync Effect] Router sync failed:', err));
            }
        }
      }
    }
  }, [router.pathname, router.asPath, router.locale, session, setStoreSettings, authoritativeLocale]);

  useEffect(() => {
    const langToSet = authoritativeLocale;
    if (typeof document !== 'undefined') {
      if (document.documentElement.lang !== langToSet) {
        document.documentElement.lang = langToSet;
      }
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [authoritativeLocale]);

  const value = useMemo((): I18nContextType => {
    // The guard for isLoading or !settings is for when settings are essential for other parts of the context
    // or to prevent rendering with incomplete data. Here, authoritativeLocale is already calculated.
    return {
      changeLocale,
      currentLocale: authoritativeLocale,
      availableLocales: localeDetailsMap,
    };
  }, [changeLocale, authoritativeLocale]);

  if (isLoading && !settings) { // Adjusted condition: perhaps only block if critical settings are loading
    return null; 
  }

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
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
