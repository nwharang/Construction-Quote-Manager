import enTranslations from './locales/en';
import viTranslations from './locales/vi';
import { type AppLocale, locales } from '~/i18n/locales';
// Import the separated types
import type { TranslationKey, TranslationParamSchema, TranslationParams } from '~/types/i18n/schema';

// Re-export for convenience if needed elsewhere
export { type AppLocale, locales };
// Re-export the imported types
export { type TranslationKey, type TranslationParamSchema, type TranslationParams };

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

// Type representing the structure of the full translation object
// Used to ensure both enTranslations and viTranslations implement all keys eventually.
// This interface should align with the TranslationKey union type.
// TODO: Add *all* keys from TranslationKey here for comprehensive checking.
export interface TranslationKeys {
  // Common
  'app.name': string;
  'app.tagline': string;
  // ... many other keys omitted for brevity ...
  'quoteSummary.tax': string;
}