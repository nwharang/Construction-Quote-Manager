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

  // Minimal render log if needed, removed the verbose one

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
          router
            .replace(router.pathname, router.asPath, { locale: appLocale, scroll: false })
            .catch((err) =>
              console.error(
                '[I18nProvider Storage Sync Effect] Router sync from storage failed:',
                err
              )
            ); // Keep error log
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

  // Defer context value calculation until settings are confirmed available
  const value = useMemo((): I18nContextType => {
    // Return a *default* context value if settings aren't ready
    if (isLoading || !settings) {
      return {
        // Provide a dummy or no-op changeLocale if needed, or make it conditional
        changeLocale: () => {
          console.warn('Attempted to change locale before I18n context fully loaded.');
        },
        currentLocale: DEFAULT_LOCALE as AppLocale,
        availableLocales: localeDetailsMap,
      };
    }
    // Calculate the actual context value only when settings are loaded
    return {
      changeLocale,
      currentLocale: (settings?.locale as AppLocale) ?? DEFAULT_LOCALE,
      availableLocales: localeDetailsMap,
    };
  }, [settings, isLoading, changeLocale]); // Add isLoading and settings to dependencies

  // Render nothing or a loader if config is still loading OR settings aren't populated
  // We still delay children rendering, but the context *value* exists sooner
  if (isLoading || !settings) {
    return null; // Or <Spinner />;
  }

  // Only render provider and children when config is loaded and settings are available
  return (
    // Always render the provider now, but conditionally render children via the check above
    // The value will be default initially, then update
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
