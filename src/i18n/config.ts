export const defaultLocale = 'en';
export const locales = ['en', 'es', 'fr', 'de', 'vi'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  vi: 'Tiếng Việt',
};

export const dateFormats: Record<Locale, string> = {
  en: 'MM/DD/YYYY',
  es: 'DD/MM/YYYY',
  fr: 'DD/MM/YYYY',
  de: 'DD.MM.YYYY',
  vi: 'DD/MM/YYYY',
};

export const timeFormats: Record<Locale, string> = {
  en: '12h',
  es: '24h',
  fr: '24h',
  de: '24h',
  vi: '24h',
};

export const currencyFormats: Record<Locale, string> = {
  en: 'USD',
  es: 'EUR',
  fr: 'EUR',
  de: 'EUR',
  vi: 'VND',
};

export const numberFormats: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  vi: 'vi-VN',
}; 