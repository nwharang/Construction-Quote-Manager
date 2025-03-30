/**
 * @deprecated Use the useTranslation hook from '~/utils/i18n' directly
 * This is a compatibility layer for old code that still uses useFormatting
 */

import { useTranslation } from '~/utils/i18n';

export function useFormatting() {
  const { formatDate, formatCurrency, formatPhone, t } = useTranslation();
  
  // Compatibility with old API
  return {
    formatDate: (date: Date | string | null | undefined): string => {
      if (!date) return '';
      return formatDate(date as Date, 'short');
    },
    
    formatCurrency: (amount: number | string | null | undefined): string => {
      if (amount === null || amount === undefined) return '';
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numAmount)) return '';
      return formatCurrency(numAmount);
    },
    
    formatNumber: (num: number | string | null | undefined): string => {
      if (num === null || num === undefined) return '';
      const number = typeof num === 'string' ? parseFloat(num) : num;
      if (isNaN(number)) return '';
      return number.toLocaleString();
    },
    
    formatPhone: (phone: string | null | undefined): string => {
      if (!phone) return '';
      return formatPhone(phone);
    }
  };
} 