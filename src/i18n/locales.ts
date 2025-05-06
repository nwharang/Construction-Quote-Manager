/**
 * This file defines the supported locales in the application.
 * It's used for type checking and locale-specific operations.
 */

// Define the actual locales object
export const locales = {
  en: { name: 'English', flag: '🇺🇸' },
  vi: { name: 'Tiếng Việt', flag: '🇻🇳' },
  // Add future languages here with name and flag
  // es: { name: 'Español', flag: '🇪🇸' },
};

// Define the AppLocale union type based on the keys of the locales object
export type AppLocale = keyof typeof locales;

// Define the type for the locale information object
export interface LocaleInfo {
  name: string;
  flag: string;
}

// Define a type that maps AppLocale keys to LocaleInfo objects
// This acts as a check that 'locales' conforms to the structure
export type LocalesMap = {
  [key in AppLocale]: LocaleInfo;
};

/**
 * Default locale to use if none is specified
 */
export const DEFAULT_LOCALE: AppLocale = 'vi';

/**
 * Utility function to check if a locale string is a supported AppLocale
 * @param locale The locale string to check
 * @returns True if the locale is supported, false otherwise
 */
export function isSupportedLocale(locale: string): locale is AppLocale {
  return locale in locales;
}

/**
 * Utility function to get a valid AppLocale from a locale string.
 * Falls back to DEFAULT_LOCALE if the provided locale is not supported.
 * @param locale The potential locale string
 * @returns A valid AppLocale
 */
export function getValidLocale(locale: string | undefined): AppLocale {
  if (locale && isSupportedLocale(locale)) {
    return locale;
  }
  return DEFAULT_LOCALE;
}
