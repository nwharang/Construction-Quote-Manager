export interface Settings {
  // Company information
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;

  // Quote defaults
  defaultComplexityCharge?: string | number;
  defaultMarkupCharge?: string | number;
  defaultTaskPrice?: string | number;
  defaultMaterialPrice?: string | number;

  // Notification settings
  emailNotifications?: boolean;
  quoteNotifications?: boolean;
  taskNotifications?: boolean;

  // Appearance
  theme: 'light' | 'dark' | 'system';
  locale: string;
  currency?: string;
  currencySymbol?: string;
  dateFormat?: string;
  timeFormat?: string;
} 