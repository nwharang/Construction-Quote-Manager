import { create } from 'zustand';
import type { Settings } from '~/types';
import { 
  DEFAULT_LOCALE, 
  DEFAULT_CURRENCY, 
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_UI_SETTINGS,
  DEFAULT_MARKUP_PERCENTAGE,
  DEFAULT_COMPLEXITY_CHARGE,
  DEFAULT_TASK_PRICE,
  DEFAULT_MATERIAL_PRICE
} from '~/config/constants';

interface ConfigState {
  // User configurable settings (stored in DB)
  settings: Settings;
  isLoading: boolean;
  isUpdating: boolean;
  
  // UI state that doesn't persist to DB
  isNavOpen: boolean;
  isDarkMode: boolean;
  
  // Actions
  setSettings: (settings: Partial<Settings>) => void;
  setLoading: (isLoading: boolean) => void;
  setUpdating: (isUpdating: boolean) => void;
  toggleNav: () => void;
  toggleDarkMode: () => void;
}

const defaultSettings: Settings = {
  // Company information
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',

  // Quote defaults
  defaultComplexityCharge: DEFAULT_COMPLEXITY_CHARGE,
  defaultMarkupCharge: DEFAULT_MARKUP_PERCENTAGE,
  defaultTaskPrice: DEFAULT_TASK_PRICE,
  defaultMaterialPrice: DEFAULT_MATERIAL_PRICE,

  // Notification settings
  emailNotifications: true,
  quoteNotifications: true,
  taskNotifications: true,

  // Appearance
  theme: 'system',
  locale: DEFAULT_LOCALE,
  currency: DEFAULT_CURRENCY,
  currencySymbol: DEFAULT_CURRENCY_SYMBOL,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
};

export const useConfigStore = create<ConfigState>((set) => ({
  // Default state
  settings: defaultSettings,
  isLoading: true,
  isUpdating: false,
  isNavOpen: false,
  isDarkMode: false,
  
  // Actions
  setSettings: (newSettings) => set((state) => ({ 
    settings: { ...state.settings, ...newSettings } 
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setUpdating: (isUpdating) => set({ isUpdating }),
  
  toggleNav: () => set((state) => ({ 
    isNavOpen: !state.isNavOpen 
  })),
  
  toggleDarkMode: () => set((state) => ({
    isDarkMode: !state.isDarkMode,
    settings: {
      ...state.settings,
      theme: state.isDarkMode ? 'light' : 'dark'
    }
  })),
})); 