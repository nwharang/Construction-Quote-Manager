import { createContext, useContext } from 'react';
import type { AppLocale, LocalesMap } from '~/i18n/locales';

export interface I18nContextType {
  changeLocale: (newLocale: AppLocale) => void;
  currentLocale: AppLocale;
  availableLocales: LocalesMap;
}

// Create the context with undefined default value
// This ensures consumers must be wrapped in a provider
export const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Custom hook to use the I18n context
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
