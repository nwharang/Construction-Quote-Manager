import { useCallback } from 'react';
import {
  type AppLocale,
  type TranslationKey,
  type TranslationParamSchema,
  type TranslationParams,
  translations,
} from '~/utils/translations';
// Import the definitive locales object
import { locales as sourceLocales } from '~/i18n/locales';
import { useI18n } from './useI18n';
import { useConfigStore } from '~/store/configStore'; // Import config store

// Define the overload signatures for the translate function *outside* the hook
// Overload 1: Key requires specific parameters defined in TranslationParamSchema
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare function translateFn<T extends keyof TranslationParamSchema>(
  key: T,
  params: TranslationParams<T>
): string;

// Overload 2: Key does not require parameters, or they are optional generic ones
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare function translateFn(
  key: TranslationKey, // Allows any key from the main union type
  params?: Record<string, string | number> // Optional generic params
): string;

// Define the return type for the hook
interface UseTranslationReturn {
  t: typeof translateFn;
  formatCurrency: (value: number | string) => string;
  formatDate: (date: Date | string, format?: 'short' | 'long') => string;
  locales: typeof sourceLocales; // Use the imported type
}

export function useTranslation(): UseTranslationReturn {
  // Use the defined return type
  const { currentLocale: i18nLocale } = useI18n();

  // REVERT to selecting the whole settings object for potentially better reactivity
  const settings = useConfigStore((state) => state.settings);

  // Determine effective locale (store > i18n context > fallback)
  const locale = settings?.locale || i18nLocale || 'en';

  // Use the declared overloads with the useCallback implementation
  const translate = useCallback(
    (
      key: TranslationKey, // Use the broader type for the implementation signature
      params?: Record<string, string | number> // Use the broader type here too
    ): string => {
      // Use the effective locale for translations
      // Cast locale to AppLocale to satisfy indexing type check
      const translation =
        translations[locale as AppLocale]?.[key] || translations['en']?.[key] || key;

      if (!params) return translation;

      // Handle named parameters
      return Object.entries(params).reduce(
        (str, [paramKey, value]) => str.replace(`{${paramKey}}`, String(value)),
        translation
      );
    },
    [locale] // Depend only on the effective locale
  ) as typeof translateFn; // Assert the implementation matches the declared overloads

  const formatCurrency = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    // Use settings from the selected settings object
    const effectiveLocale = settings?.locale || locale || 'en'; // Use combined locale logic
    const effectiveCurrency = settings?.currency || 'USD';
    const effectiveSymbol = settings?.currencySymbol;

    if (isNaN(numValue)) return 'NaN';

    try {
      return new Intl.NumberFormat(effectiveLocale, {
        style: 'currency',
        currency: effectiveCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue);
    } catch (error) {
      const symbolToUse = effectiveSymbol || '$';
      return `${symbolToUse}${numValue.toFixed(2)}`;
    }
  };

  const formatDate = (date: Date | string, formatType: 'short' | 'long' = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';

    // Use settings from the selected settings object
    const effectiveLocale = settings?.locale || locale || 'en'; // Use combined locale logic
    const userDateFormat = settings?.dateFormat || 'MM/DD/YYYY';

    try {
      // Declare formattedDate once here
      let formattedDate: string;

      // Map userDateFormat to Intl options (this is simplified, might need more robust mapping)
      let options: Intl.DateTimeFormatOptions = {};
      if (userDateFormat === 'YYYY-MM-DD') {
        // Note: 'long' month format isn't directly requested by YYYY-MM-DD
        // but we need to decide how 'short'/'long' parameter interacts with specific format string
        // Let's prioritize the userDateFormat string for structure
        options = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        };
      } else if (userDateFormat === 'MM/DD/YYYY') {
        options = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        };
      } else if (userDateFormat === 'DD/MM/YYYY') {
        // Example addition
        options = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        };
      } else {
        // Default/Fallback options based on formatType if userDateFormat is unknown
        options = {
          year: 'numeric',
          month: formatType === 'long' ? 'long' : '2-digit',
          day: '2-digit',
        };
      }

      // Attempt formatting with resolved options
      // Assign to the declared formattedDate variable
      formattedDate = new Intl.DateTimeFormat(effectiveLocale, options).format(dateObj);

      // Manual adjustments if Intl doesn't match the exact string format
      // (Intl gives locale-specific separators, not necessarily YYYY-MM-DD)
      // Assign to the declared formattedDate variable
      if (userDateFormat === 'YYYY-MM-DD') {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else if (userDateFormat === 'MM/DD/YYYY') {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        formattedDate = `${month}/${day}/${year}`;
      } else if (userDateFormat === 'DD/MM/YYYY') {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        formattedDate = `${day}/${month}/${year}`;
      }
      // If formatType was 'long' and user format doesn't specify long month, Intl might have used numeric.
      // This logic gets complex quickly. For now, prioritizing the structure from userDateFormat.

      return formattedDate;
    } catch (error) {
      // Basic fallback using YYYY-MM-DD - does not use formattedDate
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  };

  return {
    t: translate,
    formatCurrency,
    formatDate,
    locales: sourceLocales, // Return the imported source locales object
  };
}
