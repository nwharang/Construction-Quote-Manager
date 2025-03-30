import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge class names with tailwind classes
 * This is commonly used in UI components to handle class name combinations
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a string
 */
export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

/**
 * Format a currency value
 * @param value Number to format as currency
 * @param currency Currency code (default: USD)
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format a percentage value
 * @param value Number to format as percentage
 * @param decimals Number of decimal places
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate a string to a maximum length and add ellipsis
 */
export function truncate(str: string, length = 50): string {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

/**
 * Formats a User-Friendly ID from a sequential ID and UUID
 * Format: #123 (ae42b8...)
 */
export function formatDisplayId(sequentialId: number, uuid: string): string {
  const shortUuid = uuid.substring(0, 6);
  return `#${sequentialId} (${shortUuid}...)`;
} 