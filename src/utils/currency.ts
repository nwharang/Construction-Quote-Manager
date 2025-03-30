/**
 * Currency utilities to handle monetary values consistently
 * Implements the rounding logic required in Context.md
 */

/**
 * Round a number to 2 decimal places for currency display
 * Uses Math.round for consistent rounding behavior
 * @param value Number to round
 * @returns Rounded value to 2 decimal places
 */
export const roundCurrency = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Format a number as currency with the provided locale and currency code
 * @param value Number to format
 * @param locale Locale to use for formatting
 * @param currency Currency code to use
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number | string,
  locale = 'en-US',
  currency = 'USD'
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Calculate the sum of an array of numbers, with proper rounding
 * @param values Array of numbers to sum
 * @returns Sum with proper rounding
 */
export const sumCurrency = (values: number[]): number => {
  const sum = values.reduce((acc, val) => acc + val, 0);
  return roundCurrency(sum);
};

/**
 * Apply a percentage to a value, with proper rounding
 * @param value Base value
 * @param percentage Percentage to apply (e.g., 10 for 10%)
 * @returns Calculated value with proper rounding
 */
export const applyPercentage = (value: number, percentage: number): number => {
  return roundCurrency(value * (percentage / 100));
};

/**
 * Parse a string to a number, handling potential rounding errors
 * @param value String value to parse
 * @returns Parsed numeric value, rounded to 2 decimal places
 */
export const parseCurrencyString = (value: string): number => {
  return roundCurrency(parseFloat(value));
}; 