import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { useConfigStore } from '~/store';
import { locales, useTranslation } from '~/utils/i18n';

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
  const { changeLocale } = useTranslation();
  const { settings, setSettings } = useConfigStore();
  
  // Handle locale change
  const handleLocaleChange = (newLocale: string) => {
    if (locales[newLocale as keyof typeof locales]) {
      // Update the config store
      setSettings({ locale: newLocale });
      
      // Update the i18n system
      changeLocale(newLocale);
    }
  };
  
  const value = {
    changeLocale: handleLocaleChange,
    currentLocale: settings.locale || router.locale || 'en',
    availableLocales: locales
  };
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export default I18nProvider; 