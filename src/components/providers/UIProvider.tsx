'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import { useTheme } from './ThemeProvider';

// Define the types for our UI context
interface UIContextType {
  // Form styling
  formSettings: {
    labelSize: 'sm' | 'md' | 'lg';
    spacing: 'compact' | 'normal' | 'relaxed';
    errorPlacement: 'below' | 'inline';
  };
  // Button styling
  buttonSettings: {
    primaryColor: 'primary' | 'secondary' | 'success';
    dangerColor: 'danger' | 'error';
    size: 'sm' | 'md' | 'lg';
  };
  // Modal styling
  modalSettings: {
    maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    placement: 'center' | 'top' | 'bottom';
  };
  // Table styling
  tableSettings: {
    stripedRows: boolean;
    hoverable: boolean;
    compact: boolean;
  };
  // Update functions
  updateFormSettings: (settings: Partial<UIContextType['formSettings']>) => void;
  updateButtonSettings: (settings: Partial<UIContextType['buttonSettings']>) => void;
  updateModalSettings: (settings: Partial<UIContextType['modalSettings']>) => void;
  updateTableSettings: (settings: Partial<UIContextType['tableSettings']>) => void;
}

// Create the context with undefined default value
const UIContext = createContext<UIContextType | undefined>(undefined);

// Default settings
const defaultFormSettings: UIContextType['formSettings'] = {
  labelSize: 'sm',
  spacing: 'normal',
  errorPlacement: 'below',
};

const defaultButtonSettings: UIContextType['buttonSettings'] = {
  primaryColor: 'primary',
  dangerColor: 'danger',
  size: 'md',
};

const defaultModalSettings: UIContextType['modalSettings'] = {
  maxWidth: 'md',
  placement: 'center',
};

const defaultTableSettings: UIContextType['tableSettings'] = {
  stripedRows: true,
  hoverable: true,
  compact: false,
};

interface UIProviderProps {
  children: React.ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const { data: session } = useSession();
  const { isDark } = useTheme();
  
  // State for our settings
  const [formSettings, setFormSettings] = useState(defaultFormSettings);
  const [buttonSettings, setButtonSettings] = useState(defaultButtonSettings);
  const [modalSettings, setModalSettings] = useState(defaultModalSettings);
  const [tableSettings, setTableSettings] = useState(defaultTableSettings);

  // Fetch user preferences if logged in
  const { data: settings } = api.settings.get.useQuery(undefined, {
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update functions
  const updateFormSettings = (newSettings: Partial<UIContextType['formSettings']>) => {
    setFormSettings(prev => ({ ...prev, ...newSettings }));
    // TODO: Persist to user settings if needed
  };

  const updateButtonSettings = (newSettings: Partial<UIContextType['buttonSettings']>) => {
    setButtonSettings(prev => ({ ...prev, ...newSettings }));
    // TODO: Persist to user settings if needed
  };

  const updateModalSettings = (newSettings: Partial<UIContextType['modalSettings']>) => {
    setModalSettings(prev => ({ ...prev, ...newSettings }));
    // TODO: Persist to user settings if needed
  };

  const updateTableSettings = (newSettings: Partial<UIContextType['tableSettings']>) => {
    setTableSettings(prev => ({ ...prev, ...newSettings }));
    // TODO: Persist to user settings if needed
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      formSettings,
      buttonSettings,
      modalSettings,
      tableSettings,
      updateFormSettings,
      updateButtonSettings,
      updateModalSettings,
      updateTableSettings,
    }),
    [formSettings, buttonSettings, modalSettings, tableSettings]
  );

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
}

// Hook to use the UI context
export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
} 