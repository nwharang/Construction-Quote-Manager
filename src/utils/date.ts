/**
 * Utility functions for working with dates
 */

import { useI18n } from '~/components/providers/I18nProvider';
import { useTranslation } from '~/hooks/useTranslation';

/**
 * Format a date to a localized string
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions to use
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions | 'full'
): string {
  const { currentLocale } = useI18n();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  let defaultOptions: Intl.DateTimeFormatOptions;

  if (options === 'full') {
    defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
  } else {
    defaultOptions = options || {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
  }

  return dateObj.toLocaleDateString(currentLocale, defaultOptions);
}

/**
 * Format a date to include time
 * @param date Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string): string {
  const { currentLocale } = useI18n();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleDateString(currentLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a relative time (e.g., "5 minutes ago")
 * @param date Date to format relative to now
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const { t } = useTranslation();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    // TODO: Localize "just now" and relative units if needed
    return t('common.justNow');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  return formatDate(dateObj);
}
