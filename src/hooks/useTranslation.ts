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
      let translation = translationSet[key as keyof typeof translationSet] || key; // Fallback to key if not found

      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          // Use a safer regex that accounts for potential template issues
          // Or better, ensure consistent placeholder format like {{paramKey}}
          const regex = new RegExp(`\{\{\s*${paramKey}\s*\}\}`, 'g'); // Assuming {{ key }} format
          translation = translation.toString().replace(regex, String(value));
        });
      }
      return translation as string;
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
      
      // If locale is Vietnamese, default to VND if not specified
      const effectiveCurrency = 
        effectiveLocale === 'vi' && !settings?.currency 
          ? 'VND' 
          : settings?.currency || 'USD';

      if (isNaN(numValue)) return 'NaN';

      try {
        // Create options based on the currency
        const options: Intl.NumberFormatOptions = {
          style: 'currency',
          currency: effectiveCurrency,
          // Adjust fractional digits based on currency (many currencies like VND don't use decimal places)
          minimumFractionDigits: ['VND', 'JPY', 'KRW'].includes(effectiveCurrency) ? 0 : 2,
          maximumFractionDigits: ['VND', 'JPY', 'KRW'].includes(effectiveCurrency) ? 0 : 2,
          // Ensure currencyDisplay respects the locale's preferences
          currencyDisplay: 'symbol',
          // Add useGrouping for proper thousand separators
          useGrouping: true,
        };

        // Special handling for VND in Vietnamese locale
        if (effectiveCurrency === 'VND' && effectiveLocale === 'vi') {
          // Use the native Intl formatter for Vietnamese Dong
          return new Intl.NumberFormat('vi-VN', options).format(numValue);
        }

        return new Intl.NumberFormat(effectiveLocale, options).format(numValue);
      } catch (error) {
        // More robust fallback that respects currency type
        console.error(`Currency formatting error: ${error}`);
        let symbol = '$';
        let fractionDigits = 2;
        
        // Simple mapping for fallback symbols and decimal places
        if (effectiveCurrency === 'VND') {
          symbol = '₫';
          fractionDigits = 0; // VND typically doesn't use decimal places
        } else if (effectiveCurrency === 'EUR') {
          symbol = '€';
        } else if (effectiveCurrency === 'GBP') {
          symbol = '£';
        } else if (effectiveCurrency === 'JPY' || effectiveCurrency === 'KRW') {
          symbol = effectiveCurrency === 'JPY' ? '¥' : '₩';
          fractionDigits = 0; // JPY and KRW don't use decimal places
        }
        
        // Format with appropriate decimal places and thousand separators
        const formattedValue = numValue.toFixed(fractionDigits);
        
        // Add thousand separators based on locale
        // Vietnamese uses periods for thousand separators
        const withSeparators = effectiveLocale === 'vi'
          ? formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
          : formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        
        // Position the symbol according to locale conventions
        // In Vietnamese the currency symbol comes after the amount
        if (effectiveLocale === 'vi') {
          // For Vietnamese, VND symbol after the number with a space
          return effectiveCurrency === 'VND' 
            ? `${withSeparators} ${symbol}`
            : `${withSeparators} ${effectiveCurrency}`;
        } else if (['fr', 'es', 'it'].includes(effectiveLocale)) {
          // Other locales that place symbol after the number
          return `${withSeparators} ${symbol}`;
        } else {
          // Default format with symbol before the number
          return `${symbol}${withSeparators}`;
        }
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
