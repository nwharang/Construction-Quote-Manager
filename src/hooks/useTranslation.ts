import { useCallback } from 'react';
// Remove old imports
// import { type AppLocale, type TranslationKey, translations } from '~/utils/translations';
// import type { TranslationParams } from '~/types/i18n/keys'; // Remove old TranslationParams import

// Import necessary types from keys.ts
import type {
  TranslationKey,
  KeyToParams,
  KeysWithParams,
  KeysWithoutParams,
  NoParams,
} from '~/types/i18n/keys';
import { translations } from '~/utils/translations'; // Keep this for runtime
import { type AppLocale } from '~/i18n/locales'; // Keep for AppLocale type
import { locales as sourceLocales } from '~/i18n/locales';
import { useI18n } from './useI18n';
import { useConfigStore } from '~/store/configStore';

// Remove old declarations
// declare function translateFn<T extends keyof TranslationParams<T>>(
//   key: T,
//   params: TranslationParams<T>
// ): string;
// declare function translateFn(
//   key: TranslationKey,
//   params?: Record<string, string | number>
// ): string;

// Define the new TFunction interface with overloads based on parameter requirement
interface TFunction {
  <K extends KeysWithParams>(key: K, params: KeyToParams<K>): string;
  <K extends KeysWithoutParams>(key: K, params?: NoParams): string;
}

// Define the return type for the hook using TFunction
interface UseTranslationReturn {
  t: TFunction;
  formatCurrency: (value: number | string) => string;
  formatDate: (date: Date | string, format?: 'short' | 'long') => string;
  locales: typeof sourceLocales;
}

// Implementation of the useTranslation hook
export function useTranslation(): UseTranslationReturn {
  // *** Revert implementation details back to previous working state ***
  const { currentLocale: i18nLocale } = useI18n();
  const settings = useConfigStore((state) => state.settings);
  const locale = settings?.locale || i18nLocale || 'en';

  const translateImpl = useCallback(
    (
      key: TranslationKey, // Use the broader type for the implementation signature
      params?: Record<string, string | number> // Use the broader type here too
    ): string => {
      const currentLocale = locale in translations ? locale : 'en'; // Ensure locale is valid
      const translationSet = translations[currentLocale as AppLocale] || translations['en']; // Fallback safely
      let translation = translationSet[key] || key; // Fallback to key if not found

      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          // Use a safer regex that accounts for potential template issues
          // Or better, ensure consistent placeholder format like {{paramKey}}
          const regex = new RegExp(`\{\{\s*${paramKey}\s*\}\}`, 'g'); // Assuming {{ key }} format
          translation = translation.replace(regex, String(value));
        });
      }
      return translation;
    },
    [locale]
  );

  // Cast the implementation to the TFunction interface to satisfy the overloads
  const translate = translateImpl as TFunction;

  // Revert formatCurrency and formatDate implementations
  const formatCurrency = useCallback(
    (value: number | string): string => {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      const effectiveLocale = settings?.locale || locale || 'en';
      const effectiveCurrency = settings?.currency || 'USD';

      if (isNaN(numValue)) return 'NaN';

      try {
        return new Intl.NumberFormat(effectiveLocale, {
          style: 'currency',
          currency: effectiveCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numValue);
      } catch (error) {
        // Fallback for unsupported locales/currencies
        console.error(`Currency formatting error: ${error}`);
        const symbolToUse = effectiveCurrency === 'VND' ? '₫' : '$'; // Example fallback symbol logic
        return `${symbolToUse}${numValue.toFixed(2)}`;
      }
    },
    [settings?.locale, locale, settings?.currency]
  );

  const formatDate = useCallback(
    (date: Date | string, formatType: 'short' | 'long' = 'short'): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';

      const effectiveLocale = settings?.locale || locale || 'en';
      const userDateFormat = settings?.dateFormat || 'MM/DD/YYYY';

      try {
        let options: Intl.DateTimeFormatOptions = {};

        // Prioritize structural format from userDateFormat
        if (userDateFormat === 'YYYY-MM-DD') {
          options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        } else if (userDateFormat === 'MM/DD/YYYY') {
          options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        } else if (userDateFormat === 'DD/MM/YYYY') {
          options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        } else {
          // Fallback based on 'short'/'long' if user format is unknown/unsupported by simple mapping
          options = {
            year: 'numeric',
            month: formatType === 'long' ? 'long' : '2-digit',
            day: '2-digit',
          };
        }

        let formattedDate = new Intl.DateTimeFormat(effectiveLocale, options).format(dateObj);

        // Adjust format string manually if Intl doesn't match exactly (e.g., separators)
        // This part is brittle and might need refinement based on observed Intl outputs
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

        return formattedDate;
      } catch (error) {
        console.error(`Date formatting error: ${error}`);
        // Basic fallback
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    },
    [settings?.locale, locale, settings?.dateFormat]
  );
  // *** End of reverted implementation ***

  return {
    t: translate,
    formatCurrency,
    formatDate,
    locales: sourceLocales,
  };
}
