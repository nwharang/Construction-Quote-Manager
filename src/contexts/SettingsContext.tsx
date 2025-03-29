import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/utils/api';

export type Settings = {
  locale?: string;
  theme?: 'light' | 'dark' | 'system';
  currency?: string;
  company?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  quoteDefaults?: {
    complexityCharge?: number;
    markupCharge?: number;
  };
  notifications?: {
    email?: boolean;
    quotes?: boolean;
    tasks?: boolean;
  };
};

type SettingsContextType = {
  settings: Settings | null;
  saveSettings: (settings: Settings) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  saveSettings: async () => {},
  isLoading: false,
  error: null,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { data: settingsData, isLoading: isLoadingSettings } = api.settings.get.useQuery(
    undefined,
    {
      enabled: !!session,
      onSuccess: (data) => {
        setSettings(data);
      },
      onError: (err) => {
        setError(err instanceof Error ? err : new Error('Failed to load settings'));
      },
    }
  );

  const updateSettingsMutation = api.settings.update.useMutation({
    onSuccess: (data) => {
      setSettings(data);
    },
    onError: (err) => {
      setError(err instanceof Error ? err : new Error('Failed to save settings'));
    },
  });

  useEffect(() => {
    setIsLoading(isLoadingSettings);
  }, [isLoadingSettings]);

  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  const saveSettings = async (newSettings: Settings) => {
    try {
      setIsLoading(true);
      await updateSettingsMutation.mutateAsync(newSettings);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to save settings'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, isLoading, error }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext); 