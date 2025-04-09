import { useCallback, useEffect } from 'react';
import { useConfigStore } from '~/store/configStore';
import { useTranslation } from './useTranslation';

/**
 * Hook to handle automatic currency based on locale
 * This ensures that when users switch locale, the currency updates appropriately
 */
export const useLocaleCurrency = () => {
  const { settings, setSettings } = useConfigStore();
  const { t } = useTranslation();

  // Function to get the default currency for a locale
  const getDefaultCurrencyForLocale = useCallback((locale: string): string => {
    switch (locale) {
      case 'vi':
        return 'VND';
      case 'en':
        return 'USD';
      case 'fr':
        return 'EUR';
      case 'de':
        return 'EUR';
      case 'ja':
        return 'JPY';
      case 'ko':
        return 'KRW';
      default:
        return 'USD';
    }
  }, []);

  // Effect to update currency when locale changes
  const syncLocaleCurrency = useCallback(() => {
    if (settings?.locale) {
      const currentLocale = settings.locale;
      const currentCurrency = settings.currency;
      const defaultCurrency = getDefaultCurrencyForLocale(currentLocale);

      // Only update if the current currency doesn't match the expected default
      if (currentCurrency !== defaultCurrency) {
        console.log(`[useLocaleCurrency] Updating currency to ${defaultCurrency} for locale ${currentLocale}`);
        setSettings({
          currency: defaultCurrency
        });
      }
    }
  }, [settings?.locale, settings?.currency, getDefaultCurrencyForLocale, setSettings]);

  // Automatically sync currency when locale changes
  useEffect(() => {
    syncLocaleCurrency();
  }, [settings?.locale, syncLocaleCurrency]);

  return {
    syncLocaleCurrency
  };
}; 