import React, { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useConfigStore } from '~/store';
import { locales, useTranslation } from '~/utils/i18n';
import { api } from '~/utils/api';
import { useSession } from 'next-auth/react';

interface I18nContextType {
  changeLocale: (locale: string) => void;
  currentLocale: string;
  availableLocales: typeof locales;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const router = useRouter();
  const { changeLocale: i18nChangeLocale } = useTranslation();
  const { settings, setSettings } = useConfigStore();
  const { data: session } = useSession();
  const isChangingLocale = useRef(false);

  // Get the settings from the database when logged in
  const { data: dbSettings } = api.settings.get.useQuery(undefined, {
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleLocaleChange = (newLocale: string) => {
    if (locales[newLocale as keyof typeof locales] && newLocale !== settings.locale) {
      // Set flag to prevent circular updates
      isChangingLocale.current = true;

      // Update the config store
      setSettings({ locale: newLocale });

      // Update the i18n system
      i18nChangeLocale(newLocale);

      // Reset the changing flag after a short delay
      setTimeout(() => {
        isChangingLocale.current = false;
      }, 200);
    }
  };

  // Handle router locale changes
  useEffect(() => {
    // Skip effect if we're in the middle of a change
    if (isChangingLocale.current) return;

    const routerLocale = router.locale || 'en';
    
    // Update from DB settings but only if both values exist and are different
    if (dbSettings?.locale && dbSettings.locale !== settings.locale) {
      isChangingLocale.current = true;
      setSettings({ locale: dbSettings.locale });
      setTimeout(() => {
        isChangingLocale.current = false;
      }, 200);
      return; // Exit early to prevent multiple updates
    }

    // Only update from router if different from current setting
    if (routerLocale !== settings.locale) {
      isChangingLocale.current = true;
      setSettings({ locale: routerLocale });
      setTimeout(() => {
        isChangingLocale.current = false;
      }, 200);
    }
  }, [router.locale, dbSettings]);

  // Handle locale change

  const value = {
    changeLocale: handleLocaleChange,
    currentLocale: settings.locale || router.locale || 'en',
    availableLocales: locales,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export default I18nProvider;
