import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import { type Locale, dateFormats, timeFormats, currencyFormats, numberFormats } from '~/i18n/config';

export function useFormatting() {
  const { data: session } = useSession();
  const { data: settings } = api.settings.get.useQuery(undefined, {
    enabled: !!session,
  });

  // Use default locale from i18n config
  const locale = 'en' as Locale; // In a real app, this would come from settings or browser
  
  // Get formatting preferences from settings
  const dateFormat = settings?.dateFormat ?? dateFormats[locale];
  const timeFormat = settings?.timeFormat ?? timeFormats[locale];
  const currency = settings?.currency ?? currencyFormats[locale];
  
  // Format functions
  const formatDate = useCallback(
    (date: Date) => {
      try {
        return new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
        }).format(date);
      } catch (error) {
        return date.toLocaleDateString();
      }
    },
    [locale]
  );

  const formatTime = useCallback(
    (date: Date) => {
      try {
        return new Intl.DateTimeFormat(locale, {
          timeStyle: settings?.timeFormat === '12h' ? 'short' : 'medium',
        }).format(date);
      } catch (error) {
        return date.toLocaleTimeString();
      }
    },
    [locale, settings?.timeFormat]
  );

  const formatCurrency = useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: settings?.currency ?? 'USD',
        }).format(amount);
      } catch (error) {
        return `${settings?.currencySymbol ?? '$'}${amount.toFixed(2)}`;
      }
    },
    [locale, settings?.currency, settings?.currencySymbol]
  );

  const formatNumber = useCallback(
    (number: number) => {
      try {
        return new Intl.NumberFormat(locale, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(number);
      } catch (error) {
        return number.toString();
      }
    },
    [locale]
  );

  const formatPhone = useCallback(
    (phone: string) => {
      // Basic phone number formatting
      const cleaned = phone.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
      }
      return phone;
    },
    []
  );
  
  return {
    locale,
    dateFormat,
    timeFormat,
    currency,
    formatDate,
    formatTime,
    formatCurrency,
    formatNumber,
    formatPhone,
  };
} 