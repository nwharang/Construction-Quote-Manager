import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n';
import { locales, dateFormats, timeFormats, currencyFormats, numberFormats } from '../i18n/config';
import { useSettings } from './SettingsContext';

// Define the supported locales type from the keys of the translations object
export type SupportedLocale = keyof typeof translations;

type LocalizationContextType = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, subKey: string) => string;
  formatDate: (date: Date | string | number) => string;
  formatTime: (date: Date | string | number) => string;
  formatCurrency: (amount: number | string) => string;
  formatNumber: (number: number) => string;
  formatPhone: (phone: string) => string;
};

const defaultLocale: SupportedLocale = 'en';

const LocalizationContext = createContext<LocalizationContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: () => '',
  formatDate: () => '',
  formatTime: () => '',
  formatCurrency: () => '',
  formatNumber: () => '',
  formatPhone: () => '',
});

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);

  useEffect(() => {
    if (settings?.locale && Object.keys(translations).includes(settings.locale)) {
      setLocale(settings.locale as SupportedLocale);
    }
  }, [settings?.locale]);

  const t = (key: string, subKey: string): string => {
    if (!key || !subKey) return '';
    try {
      const translationObj = translations[locale] || translations[defaultLocale];
      // Use type assertion to avoid index signature error
      return (translationObj as any)[key]?.[subKey] || 
             (translations[defaultLocale] as any)[key]?.[subKey] || 
             `${key}.${subKey}`;
    } catch (error) {
      console.error('Translation error:', error);
      return `${key}.${subKey}`;
    }
  };

  const formatDate = (date: Date | string | number): string => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      const format = dateFormats[locale] || dateFormats[defaultLocale];
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(dateObj);
    } catch (error) {
      console.error('Date formatting error:', error);
      return String(date);
    }
  };

  const formatTime = (date: Date | string | number): string => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      const format = timeFormats[locale] || timeFormats[defaultLocale];
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: format === '12h',
      };
      return new Intl.DateTimeFormat(locale, options).format(dateObj);
    } catch (error) {
      console.error('Time formatting error:', error);
      return String(date);
    }
  };

  const formatCurrency = (amount: number | string): string => {
    if (amount === null || amount === undefined) return '';
    
    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check for NaN
    if (isNaN(numAmount)) return '';
    
    try {
      const currency = currencyFormats[locale] || currencyFormats[defaultLocale];
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numAmount);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return String(numAmount);
    }
  };

  const formatNumber = (number: number): string => {
    if (typeof number !== 'number') return '';
    try {
      const format = numberFormats[locale] || numberFormats[defaultLocale];
      return new Intl.NumberFormat(format).format(number);
    } catch (error) {
      console.error('Number formatting error:', error);
      return String(number);
    }
  };

  const formatPhone = (phone: string): string => {
    if (!phone) return '';
    try {
      // This is a simple implementation that can be expanded
      // For more complex phone formatting, consider using a library
      if (locale === 'en') {
        // US format: (XXX) XXX-XXXX
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
      } else if (locale === 'vi') {
        // Vietnam format: +84 XX XXX XXXX
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('84')) {
          const match = cleaned.match(/^84(\d{2})(\d{3})(\d{4})$/);
          if (match) {
            return `+84 ${match[1]} ${match[2]} ${match[3]}`;
          }
        } else {
          const match = cleaned.match(/^0?(\d{2})(\d{3})(\d{4})$/);
          if (match) {
            return `+84 ${match[1]} ${match[2]} ${match[3]}`;
          }
        }
      }
      // Default format for other locales - just return as is
      return phone;
    } catch (error) {
      console.error('Phone formatting error:', error);
      return phone;
    }
  };

  return (
    <LocalizationContext.Provider
      value={{
        locale,
        setLocale,
        t,
        formatDate,
        formatTime,
        formatCurrency,
        formatNumber,
        formatPhone,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export const useLocalization = () => useContext(LocalizationContext); 