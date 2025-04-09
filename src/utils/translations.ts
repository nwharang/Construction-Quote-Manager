import { type AppLocale, locales } from '~/i18n/locales';
import type { TranslationKey } from '~/types/i18n/keys';

// Import the locale objects directly
import enTranslations from './locales/en';
import viTranslations from './locales/vi';

// Re-export for convenience if needed elsewhere
export { type AppLocale, locales };
// Re-export the imported type
export { type TranslationKey };

// Combine all translations into a single object for easier lookup
export const translations = {
  en: enTranslations,
  vi: viTranslations,
  // Add other imported languages here
} as const;