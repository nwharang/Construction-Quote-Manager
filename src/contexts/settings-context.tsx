import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  // Theme settings
  theme: 'light' | 'dark' | 'system';
  
  // Quote settings
  defaultComplexityCharge: string;
  defaultMarkupCharge: string;
  defaultTaskPrice: string;
  defaultMaterialPrice: string;
  
  // Company settings
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  
  // Notification settings
  emailNotifications: boolean;
  quoteNotifications: boolean;
  taskNotifications: boolean;
  
  // Currency settings
  currency: string;
  currencySymbol: string;
  
  // Date format settings
  dateFormat: string;
  timeFormat: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isLoading: boolean;
}

const defaultSettings: Settings = {
  theme: 'system',
  defaultComplexityCharge: '0.00',
  defaultMarkupCharge: '0.00',
  defaultTaskPrice: '0.00',
  defaultMaterialPrice: '0.00',
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  emailNotifications: true,
  quoteNotifications: true,
  taskNotifications: true,
  currency: 'USD',
  currencySymbol: '$',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 