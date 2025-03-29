import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Locale, locales, defaultLocale } from '~/i18n/config';
import { translations, t, type TranslationKey, type NestedTranslationKey } from '~/i18n/locales';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';

type LocalizationContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: <T extends TranslationKey, K extends NestedTranslationKey<T>>(
    section: T,
    key: K,
    params?: Record<string, string | number>
  ) => string;
  isRtl: boolean;
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { data: settings } = api.settings.get.useQuery(undefined, {
    enabled: !!session,
  });
  
  // For now, we'll use a simple state for the locale
  // In a full implementation, this would be synchronized with user settings
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  
  // Use settings from database if available (future enhancement)
  useEffect(() => {
    // This is where we would sync with user settings
    // For now, we'll just use browser language
    const browserLocale = navigator.language.split('-')[0];
    
    if (locales.includes(browserLocale as Locale)) {
      setLocale(browserLocale as Locale);
    }
  }, []);
  
  // Translate function
  const translate = <T extends TranslationKey, K extends NestedTranslationKey<T>>(
    section: T,
    key: K,
    params?: Record<string, string | number>
  ): string => {
    return t(locale, section, key, params);
  };
  
  // Determine text direction
  const isRtl = false; // None of our current locales are RTL
  
  const value = {
    locale,
    setLocale,
    t: translate,
    isRtl,
  };
  
  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  
  return context;
} 