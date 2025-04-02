/**
 * Application constants and default configuration values
 * All app-wide constants should be defined here for consistency
 */

import type { UISettings } from '~/types/ui';

// Application name and version
export const APP_NAME = 'Construction Quote Manager';
export const APP_VERSION = '1.0.0';

// API related constants
export const API_BASE_URL = '/api';
export const API_TIMEOUT = 30000; // 30 seconds

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_OPTIONS = [5, 10, 20, 50, 100];

// Date formats
export const DATE_FORMAT = {
  SHORT: 'MM/DD/YYYY',
  LONG: 'MMMM D, YYYY',
  WITH_TIME: 'MM/DD/YYYY hh:mm A',
};

// Locale settings
export const DEFAULT_LOCALE = 'en';

// Currency settings
export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_CURRENCY_SYMBOL = '$';
export const SUPPORTED_CURRENCIES = {
  USD: { name: 'US Dollar', symbol: '$' },
  VND: { name: 'Vietnamese Dong', symbol: '₫' },
};

// UI defaults (following HeroUI patterns)
export const DEFAULT_UI_SETTINGS: UISettings = {
  formSettings: {
    labelPlacement: 'outside',
    size: 'md',
    variant: 'bordered',
    fullWidth: true,
    required: false,
  },
  buttonSettings: {
    size: 'md',
    color: 'primary',
    variant: 'solid',
    radius: 'md',
    fullWidth: false,
  },
  tableSettings: {
    striped: true,
    hoverable: true,
    bordered: false,
    shadow: 'sm',
    headerClassName: 'bg-default-50',
    cellClassName: 'py-2',
    rowClassName: '',
  },
  toastSettings: {
    duration: 3000,
    position: 'top-right',
  },
};

// Quote related constants
export const QUOTE_STATUS_OPTIONS = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export const DEFAULT_MARKUP_PERCENTAGE = 10;
export const DEFAULT_COMPLEXITY_CHARGE = 0;
export const DEFAULT_TASK_PRICE = 50;
export const DEFAULT_MATERIAL_PRICE = 100;

// Product related constants
export const PRODUCT_CATEGORY_OPTIONS = [
  { label: 'Lumber', value: 'LUMBER' },
  { label: 'Plumbing', value: 'PLUMBING' },
  { label: 'Electrical', value: 'ELECTRICAL' },
  { label: 'Paint', value: 'PAINT' },
  { label: 'Hardware', value: 'HARDWARE' },
  { label: 'Tools', value: 'TOOLS' },
  { label: 'Other', value: 'OTHER' },
];

export const PRODUCT_UNIT_OPTIONS = [
  { label: 'Each', value: 'ea' },
  { label: 'Foot', value: 'ft' },
  { label: 'Square Foot', value: 'sq ft' },
  { label: 'Cubic Foot', value: 'cu ft' },
  { label: 'Yard', value: 'yd' },
  { label: 'Square Yard', value: 'sq yd' },
  { label: 'Cubic Yard', value: 'cu yd' },
  { label: 'Gallon', value: 'gal' },
  { label: 'Pound', value: 'lb' },
  { label: 'Hour', value: 'hr' },
];

/**
 * Theme options available in the application
 */
export const THEME_OPTIONS = ['light', 'dark', 'system'] as const;

/**
 * Default theme used when no preference is set
 */
export const DEFAULT_THEME = 'system';

/**
 * Application pagination defaults
 */
export const PAGINATION = {
  /**
   * Maximum number of pagination links to show
   */
  MAX_PAGE_LINKS: 5,
};

/**
 * Quote-related constants
 */
export const QUOTE = {
  /**
   * Status options for quotes
   */
  STATUS: {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
    CANCELED: 'canceled',
  },
  /**
   * Default values for new quotes
   */
  DEFAULTS: {
    COMPLEXITY_CHARGE: 0,
    MARKUP_CHARGE: 0,
    TASK_PRICE: 0,
    MATERIAL_PRICE: 0,
  },
};

/**
 * Format constants for displaying data
 */
export const FORMAT = {
  /**
   * Currency format options
   */
  CURRENCY: {
    USD: {
      SYMBOL: '$',
      CODE: 'USD',
      DECIMAL_PLACES: 2,
    },
  },
  /**
   * Date format options
   */
  DATE: {
    US: 'MM/DD/YYYY',
    EU: 'DD/MM/YYYY',
    INTL: 'YYYY-MM-DD',
  },
  /**
   * Time format options
   */
  TIME: {
    H12: '12h',
    H24: '24h',
  },
}; 