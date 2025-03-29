import { useLocalization } from '../contexts/LocalizationContext';
import type { SupportedLocale } from '../contexts/LocalizationContext';

export type TranslationKey = string;

// Export a function to get the current locale
export const getCurrentLocale = (): SupportedLocale => {
  const defaultLocale: SupportedLocale = 'en';
  
  try {
    const storedLocale = localStorage.getItem('locale') as SupportedLocale | null;
    return storedLocale || defaultLocale;
  } catch (e) {
    return defaultLocale;
  }
};

export function useTranslation() {
  const { 
    t: translate, 
    locale, 
    setLocale, 
    formatDate, 
    formatTime, 
    formatCurrency, 
    formatNumber, 
    formatPhone 
  } = useLocalization();

  const t = (section: string, key: string, params?: Record<string, string | number>) => {
    let translatedText = translate(section, key);
    
    // Replace params if provided
    if (params && translatedText) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translatedText = translatedText.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    
    return translatedText;
  };

  return {
    t,
    locale,
    setLocale,
    formatDate,
    formatTime,
    formatCurrency,
    formatNumber,
    formatPhone,
  };
} 