import { useCallback, useEffect } from 'react';
import { useConfigStore } from '~/store/configStore';
import { useTranslation } from './useTranslation';

/**
 * Hook to handle automatic currency based on locale
 * This ensures that when users switch locale, the currency updates appropriately
 */
export const useLocaleCurrency = () => {
  const { settings, setSettings } = useConfigStore();

  // Function to get the default currency for a locale
  const getDefaultCurrencyForLocale = useCallback((locale: string): string => {
    switch (locale) {
      case 'vi':
        return 'VND';
      case 'en':
      default:
        return 'USD';
    }
  }, []);

  // Effect to update currency when locale changes
  const syncLocaleCurrency = useCallback(() => {
    if (settings?.locale) {
      const currentLocale = settings.locale;
      // Check if currency exists in settings before accessing it
      const currentCurrency = settings.currency ?? getDefaultCurrencyForLocale(currentLocale);
      const defaultCurrency = getDefaultCurrencyForLocale(currentLocale);

      // Only update if the current currency doesn't match the expected default
      if (currentCurrency !== defaultCurrency) {
        console.log(
          `[useLocaleCurrency] Updating currency to ${defaultCurrency} for locale ${currentLocale}`
        );
        setSettings({
          currency: defaultCurrency,
        });
      }
    }
  }, [settings?.locale, settings?.currency, getDefaultCurrencyForLocale, setSettings]);

  // Automatically sync currency when locale changes
  useEffect(() => {
    syncLocaleCurrency();
  }, [settings?.locale, syncLocaleCurrency]);

  return {
    syncLocaleCurrency,
  };
};
