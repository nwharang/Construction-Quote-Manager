import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useConfigStore } from '~/store';
import { locales, type AppLocale, isSupportedLocale } from '~/i18n/locales';
import { I18nContext } from '~/hooks/useI18n';
import Cookies from 'js-cookie';
// import { api } from '~/utils/api'; // Removed unused api import
// import { useSession } from 'next-auth/react'; // Commented out
// import type { Settings } from '~/store/configStore'; // Commented out

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const router = useRouter();
  const { settings, setSettings: setStoreSettings } = useConfigStore();
  // const { data: session } = useSession(); // Commented out

  const changeLocale = useCallback(
    (newLocale: AppLocale) => {
      console.log('[I18nProvider] changeLocale called with:', newLocale);
      // 1. Update Zustand store
      setStoreSettings({ locale: newLocale });

      // 2. Update Next.js router locale
      if (router.locale !== newLocale) {
        router.replace(router.pathname, router.asPath, { locale: newLocale, scroll: false });
      }

      // 3. For unauthenticated users, store in localStorage and cookies
      if (typeof window !== 'undefined') {
        const localeCookieKey = 'app-locale';
        localStorage.setItem('locale', newLocale);
        Cookies.set(localeCookieKey, newLocale, { expires: 365 });
      }

      // 4. REMOVE database update logic
      // Persistence handled explicitly on settings page
      /* 
    if (session) {
      const currentSettings = useConfigStore.getState().settings;
      const updatePayload = { ... }; // Payload construction removed
      updateSettingsMutation.mutate(updatePayload); // MUTATION CALL REMOVED
    }
    */
    },
    [router, setStoreSettings]
  );

  // Sync store locale to router locale ON INITIAL LOAD or EXTERNAL router change
  useEffect(() => {
    const routerLocale = router.locale as AppLocale | undefined;
    const storeLocale = settings?.locale as AppLocale | undefined;
    const isLoadingStore = useConfigStore.getState().isLoading; // Get loading state

    // Only sync if:
    // 1. Store is NOT loading
    // 2. Router has a valid locale
    // 3. It differs from the store's current locale
    if (
      !isLoadingStore &&
      settings &&
      routerLocale &&
      locales[routerLocale] &&
      routerLocale !== storeLocale
    ) {
      // Update the store to match the router's locale
      console.log(`[I18nProvider] Syncing store locale (${storeLocale}) to router locale (${routerLocale}) after load`); // Debug log
      setStoreSettings({ locale: routerLocale });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.locale, settings?.locale, setStoreSettings]); // Add settings?.locale and setStoreSettings for completeness

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
          console.log(`[I18nProvider] Updating store locale from ${settings?.locale} to ${appLocale}`);
          setStoreSettings({ locale: appLocale });
        }
        
        // If router locale doesn't match stored locale
        if (router.locale !== appLocale) {
          console.log(`[I18nProvider] Updating router locale from ${router.locale} to ${appLocale}`);
          router.replace(router.pathname, router.asPath, { locale: appLocale, scroll: false });
        }
      }
    }
  // Monitor both pathname and asPath to catch all navigation events
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname, router.asPath]);

  useEffect(() => {
    if (settings && typeof document !== 'undefined') {
      document.documentElement.lang = settings.locale;
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [settings]);

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
