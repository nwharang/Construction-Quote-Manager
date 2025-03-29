import { useCallback } from 'react';
import { t, type TranslationKey, type NestedTranslationKey } from '~/i18n/locales';
import { useFormatting } from './useFormatting';

// Mock function to get the current locale
// In a real app, this would come from a context provider or settings
const getCurrentLocale = () => {
  // For now, we'll always return 'en'
  // This would be replaced with actual locale detection/selection
  return 'en';
};

export function useTranslation() {
  const locale = getCurrentLocale();
  const formatting = useFormatting();
  
  const translate = useCallback(<T extends TranslationKey, K extends NestedTranslationKey<T>>(
    section: T,
    key: K,
    params?: Record<string, string | number>,
  ) => {
    return t(locale, section, key, params);
  }, [locale]);
  
  return {
    t: translate,
    locale,
    // Include formatting functions
    formatDate: formatting.formatDate,
    formatTime: formatting.formatTime,
    formatCurrency: formatting.formatCurrency,
    formatNumber: formatting.formatNumber,
    formatPhone: formatting.formatPhone,
  };
} 