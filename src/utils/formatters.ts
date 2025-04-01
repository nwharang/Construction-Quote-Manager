/**
 * Formatting utilities for consistent display of data
 * Implements the formatting requirements from Context.md
 */

/**
 * Formats a UUID to a user-friendly display format: "#<sequentialId> (<short_uuid>)"
 * This follows the format specified in Context.md
 * @param id The full UUID
 * @param sequentialId The sequential ID number
 * @param shortLength The length of the short UUID portion to display (default: 8)
 * @returns Formatted user-friendly ID
 */
export const formatUserFriendlyId = (
  id: string,
  sequentialId: number,
  shortLength = 8
): string => {
  const shortUuid = id.substring(0, shortLength);
  return `#${sequentialId} (${shortUuid}...)`;
};

/**
 * Utility functions for formatting dates, currencies, and other values
 */

/**
 * Format a date for display
 * @param date Date object or ISO string
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Default options for date formatting
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
}

/**
 * Format a date with time for display
 * @param date Date object or ISO string
 * @returns Formatted date string with time
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a currency value for display
 * @param amount Number to format
 * @param currency Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount === null || amount === undefined) return '-';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a percentage for display
 * @param value Number to format as percentage
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '-';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

/**
 * Format a phone number for display
 * @param phone Phone number string
 * @returns Formatted phone number
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  
  // Basic US phone formatting
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  
  // Return original if not standard format
  return phone;
}

/**
 * Format a number with commas for thousands separators
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return '-';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
} 