import React, { useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useConfigStore } from '~/store';
import { locales, type AppLocale } from '~/i18n/locales';
import { I18nContext } from '~/hooks/useI18n';
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

      // 3. Update document attributes (handled by useEffect below)

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
