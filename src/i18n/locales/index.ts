import { enTranslations } from './en';

// We'll add more languages as they become available
export const translations = {
  en: enTranslations,
  // Add more languages here when implemented
  // es: esTranslations,
  // fr: frTranslations,
  // de: deTranslations,
};

export type TranslationKey = keyof typeof enTranslations;
export type NestedTranslationKey<T extends TranslationKey> = keyof typeof enTranslations[T];

// Type-safe translation function
export function t<T extends TranslationKey, K extends NestedTranslationKey<T>>(
  locale: string,
  section: T,
  key: K,
  params?: Record<string, string | number>,
): string {
  // Default to English if the requested locale isn't available
  const localeToUse = (translations[locale as keyof typeof translations] ? locale : 'en') as keyof typeof translations;
  
  const translationObj = translations[localeToUse];
  // Type assertion to avoid index errors
  const sectionObj = translationObj[section] as Record<string, string>;
  const translation = sectionObj[key as string];
  
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