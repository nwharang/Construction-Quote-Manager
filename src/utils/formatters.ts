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
 * Formats a date to a localized string
 * @param date Date to format
 * @param locale Locale to use for formatting
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  locale = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale);
};

/**
 * Formats a date with time to a localized string
 * @param date Date to format
 * @param locale Locale to use for formatting
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  date: Date | string,
  locale = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString(locale);
};

/**
 * Formats a percentage value for display
 * @param value Percentage value (e.g., 10 for 10%)
 * @param fractionDigits Number of decimal places to include
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  fractionDigits = 1
): string => {
  return `${value.toFixed(fractionDigits)}%`;
}; 