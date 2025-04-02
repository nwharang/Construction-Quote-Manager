import React, { createContext, useContext, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useConfigStore } from '~/store';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  useSession();
  const setStoreSettings = useConfigStore((state) => state.setSettings);
  const currentStoreTheme = useConfigStore((state) => state.settings?.theme);
  const isStoreDarkMode = useConfigStore((state) => state.isDarkMode);
  const isLoadingStore = useConfigStore((state) => state.isLoading);

  const updateDocumentClass = useCallback((themeToApply: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      let effectiveTheme = themeToApply;
      if (themeToApply === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      root.classList.add(effectiveTheme);
    }
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (isLoadingStore) {
        return;
      }

      setStoreSettings({ theme: newTheme });

      updateDocumentClass(newTheme);

      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
      }
    },
    [setStoreSettings, updateDocumentClass, isLoadingStore]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        updateDocumentClass(storedTheme as Theme);
      }
    }
  }, [updateDocumentClass]);

  useEffect(() => {
    if (currentStoreTheme) {
      updateDocumentClass(currentStoreTheme as Theme);
    }
  }, [currentStoreTheme, updateDocumentClass]);

  const contextValue = useMemo(
    () => ({
      theme: (currentStoreTheme as Theme | undefined) ?? 'system',
      isDark: isStoreDarkMode,
      setTheme,
    }),
    [currentStoreTheme, isStoreDarkMode, setTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}
