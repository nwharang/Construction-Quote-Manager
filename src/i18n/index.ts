import { enTranslations } from './locales/en';
import { esTranslations } from './locales/es';
import { frTranslations } from './locales/fr';
import { deTranslations } from './locales/de';
import { viTranslations } from './locales/vi';

export const translations = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
  de: deTranslations,
  vi: viTranslations,
};

export type LocalizationKey = keyof typeof enTranslations;
export type TranslationSubkeys<T extends LocalizationKey> = keyof typeof enTranslations[T]; 