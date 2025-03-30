/**
 * Settings related types
 */

// Valid theme values
export type ThemeType = 'light' | 'dark' | 'system' | string;

// Valid locale values
export type LocaleType = 'en' | 'vi' | string;

// Valid time format values
export type TimeFormatType = '12h' | '24h' | string;

export interface Settings {
  // Company information
  companyName: string;
  companyEmail: string;
  companyPhone?: string | null;
  companyAddress?: string | null;

  // Quote defaults
  defaultComplexityCharge: number;
  defaultMarkupCharge: number;
  defaultTaskPrice: number;
  defaultMaterialPrice: number;

  // Notification settings
  emailNotifications: boolean;
  quoteNotifications: boolean;
  taskNotifications: boolean;

  // Appearance
  theme: ThemeType;
  locale: LocaleType;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: TimeFormatType;
}

/**
 * Settings update input type (all fields optional for partial updates)
 */
export type SettingsUpdateInput = Partial<Settings>;

/**
 * Settings with dates for database records
 */
export interface SettingsWithDates extends Settings {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
} 