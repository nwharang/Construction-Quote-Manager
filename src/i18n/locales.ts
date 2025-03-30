/**
 * This file defines the supported locales in the application.
 * It's used for type checking and locale-specific operations.
 */

/**
 * All supported locales in the application
 */
export type SupportedLocale = 'en' | 'vi' | 'es';

/**
 * Map of locale codes to their display names
 */
export const SUPPORTED_LOCALES: Record<SupportedLocale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  es: 'Español',
};

/**
 * Default locale to use if none is specified
 */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Function to check if a locale is supported
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale in SUPPORTED_LOCALES;
}

/**
 * Get a valid locale from a string, falling back to the default locale if needed
 */
export function getSafeLocale(locale?: string): SupportedLocale {
  if (locale && isSupportedLocale(locale)) {
    return locale;
  }
  return DEFAULT_LOCALE;
} 