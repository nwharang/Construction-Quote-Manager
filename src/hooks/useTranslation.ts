import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import { type Locale, dateFormats, timeFormats, currencyFormats, numberFormats } from '~/i18n/config';

export function useTranslation() {
  const { data: session } = useSession();
  const { data: settings } = api.settings.get.useQuery(undefined, {
    enabled: !!session,
  });

  const locale = settings?.locale ?? 'en';
  const dateFormat = settings?.dateFormat ?? dateFormats[locale as Locale];
  const timeFormat = settings?.timeFormat ?? timeFormats[locale as Locale];
  const currency = settings?.currency ?? currencyFormats[locale as Locale];
  const numberFormat = settings?.numberFormat ?? numberFormats[locale as Locale];

  const formatDate = useCallback(
    (date: Date) => {
      if (!settings) return date.toLocaleDateString();
      return new Intl.DateTimeFormat(settings.locale, {
        dateStyle: 'medium',
      }).format(date);
    },
    [settings]
  );

  const formatTime = useCallback(
    (date: Date) => {
      if (!settings) return date.toLocaleTimeString();
      return new Intl.DateTimeFormat(settings.locale, {
        timeStyle: settings.timeFormat === '12h' ? 'short' : 'medium',
      }).format(date);
    },
    [settings]
  );

  const formatCurrency = useCallback(
    (amount: number) => {
      if (!settings) return amount.toLocaleString();
      return new Intl.NumberFormat(settings.locale, {
        style: 'currency',
        currency: settings.currency,
      }).format(amount);
    },
    [settings]
  );

  const formatNumber = useCallback(
    (number: number) => {
      if (!settings) return number.toLocaleString();
      return new Intl.NumberFormat(settings.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(number);
    },
    [settings]
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
    numberFormat,
    formatDate,
    formatTime,
    formatCurrency,
    formatNumber,
    formatPhone,
  };
} 