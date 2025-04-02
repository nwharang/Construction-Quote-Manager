import enTranslations from './locales/en';
import viTranslations from './locales/vi';
import { type AppLocale, locales } from '~/i18n/locales';
// Import only the needed type from keys.ts
import type { TranslationKey } from '~/types/i18n/keys';

// Re-export for convenience if needed elsewhere
export { type AppLocale, locales };
// Re-export the imported type
export { type TranslationKey };

// --- Grouped Key Types --- //
// All type definitions from CommonKeys down to QuoteSummaryKeys are removed as they are now in keys.ts

// --- Combined TranslationKey Type --- //
// Removed: export type TranslationKey = ...

// --- Slot Count Definitions --- //
// Removed: export interface TranslationParamSchema { ... }

// --- Helper Types --- //
// Removed: export type TranslationParams<K extends TranslationKey> = ...

// --- Translation Resources --- //

// Combine all translations into a single object for easier lookup
export const translations = {
  en: enTranslations as Record<TranslationKey, string>,
  vi: viTranslations as Record<TranslationKey, string>,
} as const;