import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useConfigStore } from '~/store';
import { locales, type AppLocale, isSupportedLocale } from '~/i18n/locales';
import { I18nContext } from '~/hooks/useI18n';
import Cookies from 'js-cookie';
import { useSession } from 'next-auth/react';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const router = useRouter();
  const { settings, setSettings: setStoreSettings } = useConfigStore();
  const { data: session } = useSession();
  const [isUpdatingRouter, setIsUpdatingRouter] = useState(false);

  const changeLocale = useCallback(
    (newLocale: AppLocale) => {
      if (settings?.locale === newLocale) return;

      console.log('[I18nProvider] changeLocale called with:', newLocale);
      setIsUpdatingRouter(true);

      // 1. Update Zustand store
      setStoreSettings({ locale: newLocale });

      // 2. Update Next.js router locale (async)
      if (router.locale !== newLocale) {
        router.replace(router.pathname, router.asPath, { locale: newLocale, scroll: false })
          .catch((err) => {
            console.error('[I18nProvider] Router replace failed:', err);
          })
          .finally(() => {
            // Reset state after router update attempt completes
            setIsUpdatingRouter(false);
            console.log('[I18nProvider] Router update finished, resetting isUpdatingRouter state');
          });
      } else {
         // Router already matches, reset state directly
         setIsUpdatingRouter(false);
         console.log('[I18nProvider] No router change needed, resetting isUpdatingRouter state');
      }

      // 3. For unauthenticated users, store in localStorage and cookies
      if (typeof window !== 'undefined') {
        const localeCookieKey = 'app-locale';
        localStorage.setItem('locale', newLocale);
        Cookies.set(localeCookieKey, newLocale, { expires: 365 });
      }
    },
    [router, setStoreSettings, settings?.locale]
  );

  // Sync with localStorage/cookies on route changes (for auth pages)
  useEffect(() => {
    // If not loading and we're on an auth page
    if (!useConfigStore.getState().isLoading && router.pathname.includes('/auth/')) {
      console.log('[I18nProvider] Auth page detected, checking localStorage/cookies for locale');

      const localeCookieKey = 'app-locale';
      const storedLocale = Cookies.get(localeCookieKey) || localStorage.getItem('locale');

      if (storedLocale && isSupportedLocale(storedLocale)) {
        const appLocale = storedLocale as AppLocale;
        console.log(`[I18nProvider] Found stored locale: ${appLocale}`);

        // If store locale doesn't match stored locale
        if (settings?.locale !== appLocale) {
          console.log(
            `[I18nProvider] Updating store locale from ${settings?.locale} to ${appLocale}`
          );
          setStoreSettings({ locale: appLocale });
        }

        // If router locale doesn't match stored locale
        if (router.locale !== appLocale) {
          console.log(
            `[I18nProvider] Updating router locale from ${router.locale} to ${appLocale}`
          );
          router.replace(router.pathname, router.asPath, { locale: appLocale, scroll: false });
        }
      }
    }
    // Monitor both pathname and asPath to catch all navigation events
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname, router.asPath, settings?.locale, setStoreSettings]);

  useEffect(() => {
    if (settings && typeof document !== 'undefined') {
      document.documentElement.lang = settings.locale;
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [settings?.locale]);

  const value = useMemo(
    () => ({
      changeLocale,
      currentLocale: (settings?.locale as AppLocale) ?? 'en',
      availableLocales: locales,
    }),
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
