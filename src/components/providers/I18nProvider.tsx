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

  useEffect(() => {
    const routerLocale = router.locale as AppLocale | undefined;
    if (settings && routerLocale && locales[routerLocale] && routerLocale !== settings.locale) {
      setStoreSettings({ locale: routerLocale });
    }
  }, [router.locale, settings, setStoreSettings]);

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
