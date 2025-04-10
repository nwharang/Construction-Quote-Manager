import { useCallback, useEffect } from 'react';
import { useConfigStore } from '~/store/configStore';

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

  // Automatically sync currency when locale changes
  useEffect(() => {
    if (settings?.locale) {
      const currentLocale = settings.locale;
      const currentCurrency = settings.currency ?? getDefaultCurrencyForLocale(currentLocale);
      const defaultCurrency = getDefaultCurrencyForLocale(currentLocale);

      if (currentCurrency !== defaultCurrency) {
        setSettings({ currency: defaultCurrency });
      }
    }
  }, [settings?.locale, settings?.currency, setSettings, getDefaultCurrencyForLocale]);

  // Return the utility function if needed elsewhere
  return {
    getDefaultCurrencyForLocale,
  };
};
