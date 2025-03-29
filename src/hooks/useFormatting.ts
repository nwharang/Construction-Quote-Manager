import { useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import { type Locale, dateFormats, timeFormats, currencyFormats, numberFormats } from '~/i18n/config';
import { useSettings } from '~/contexts/settings-context';
import type { SupportedLocale } from '~/i18n/locales';

export function useFormatting() {
  const { data: session } = useSession();
  const { data: settings } = api.settings.get.useQuery(undefined, {
    enabled: !!session,
  });

  return useMemo(() => {
    // Get locale from settings or default to English
    const locale = (settings?.locale || 'en') as SupportedLocale;
    const currencyCode = settings?.currency || (locale === 'en' ? 'USD' : 'EUR');
    const currencySymbol = settings?.currencySymbol || (currencyCode === 'USD' ? '$' : '€');
    
    // Format a date according to the locale
    const formatDate = (date: Date | string | null | undefined): string => {
      if (!date) return '';
      
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      try {
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        };
        
        return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-ES', options).format(dateObj);
      } catch (error) {
        console.error('Date formatting error:', error);
        return String(date);
      }
    };
    
    // Format currency according to locale and settings
    const formatCurrency = (amount: number | string | null | undefined): string => {
      if (amount === null || amount === undefined) return '';
      
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      // Handle NaN
      if (isNaN(numAmount)) return '';
      
      try {
        return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-ES', {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numAmount);
      } catch (error) {
        console.error('Currency formatting error:', error);
        return `${currencySymbol}${numAmount.toFixed(2)}`;
      }
    };
    
    // Format a number according to locale
    const formatNumber = (num: number | string | null | undefined): string => {
      if (num === null || num === undefined) return '';
      
      const number = typeof num === 'string' ? parseFloat(num) : num;
      
      // Handle NaN
      if (isNaN(number)) return '';
      
      try {
        return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-ES').format(number);
      } catch (error) {
        console.error('Number formatting error:', error);
        return String(number);
      }
    };

    // Format a phone number according to locale
    const formatPhone = (phone: string | null | undefined): string => {
      if (!phone) return '';
      
      // Remove all non-numeric characters
      const cleaned = phone.replace(/\D/g, '');
      
      // Format based on length and locale
      if (locale === 'en') {
        // US format: (XXX) XXX-XXXX
        if (cleaned.length === 10) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
      } else {
        // Spanish format (simplified): XXX XX XX XX
        if (cleaned.length === 9) {
          return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
        }
      }
      
      // If no formatting rules match, return the original string
      return phone;
    };
    
    return {
      formatDate,
      formatCurrency,
      formatNumber,
      formatPhone,
    };
  }, [settings]);
} 