import { enTranslations } from './en';
import { esTranslations } from './es';
import { viTranslations } from './vi';

// Define supported locales
export type SupportedLocale = 'en' | 'es' | 'vi';

// We'll add more languages as they become available
export const translations = {
  en: enTranslations,
  es: esTranslations,
  vi: viTranslations,
  // Add more languages here when implemented
  // fr: frTranslations,
  // de: deTranslations,
};

export type TranslationKey = keyof typeof enTranslations;
export type NestedTranslationKey<T extends TranslationKey> = keyof typeof enTranslations[T];

// Function to get the current locale from settings or browser
export function getCurrentLocale(): SupportedLocale {
  try {
    // Try to get from localStorage first
    const savedLocale = typeof window !== 'undefined' 
      ? localStorage.getItem('appLocale') 
      : null;
    
    if (savedLocale && translations[savedLocale as SupportedLocale]) {
      return savedLocale as SupportedLocale;
    }
    
    // Fallback to browser language
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang && translations[browserLang as SupportedLocale]) {
        return browserLang as SupportedLocale;
      }
    }
  } catch (e) {
    console.warn('Error getting locale:', e);
  }
  
  // Default to English
  return 'en';
}

// Type-safe translation function
export function t<T extends TranslationKey>(
  locale: string,
  section: T,
  key: string,
  params?: Record<string, string | number>,
): string {
  // Default to English if the requested locale isn't available
  const localeToUse = (translations[locale as keyof typeof translations] ? locale : 'en') as keyof typeof translations;
  
  const translationObj = translations[localeToUse];
  // Use type assertion to safely access potentially dynamic properties
  const sectionObj = translationObj[section as keyof typeof translationObj] as Record<string, string>;
  const translation = sectionObj[key];
  
  if (!translation) {
    console.warn(`Translation missing: ${locale}.${String(section)}.${String(key)}`);
    return `${String(section)}.${String(key)}`;
  }
  
  if (params) {
    return Object.entries(params).reduce(
      (result, [paramKey, paramValue]) => 
        result.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue)),
      translation
    );
  }
  
  return translation;
} 