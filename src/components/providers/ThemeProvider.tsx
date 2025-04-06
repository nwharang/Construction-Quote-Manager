'use client';

import React, { createContext, useContext, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Cookies from 'js-cookie';
import { useConfigStore } from '~/store/configStore';

type Theme = 'light' | 'dark' | 'system';
const themeCookieKey = 'app-theme';

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
      console.log('[ThemeProvider] setTheme called with:', newTheme);
      
      // Skip if store is loading
      if (isLoadingStore) {
        console.log('[ThemeProvider] Store is loading, skipping theme set.');
        return;
      }

      // 1. Update the store
      setStoreSettings({ theme: newTheme });

      // 2. Update document class for immediate visual change
      updateDocumentClass(newTheme);

      // 3. Always persist to localStorage and cookies for all users
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
        Cookies.set(themeCookieKey, newTheme, { expires: 365 });
      }
    },
    [setStoreSettings, updateDocumentClass, isLoadingStore]
  );

  useEffect(() => {
    const cookieTheme = Cookies.get(themeCookieKey) as Theme | undefined;
    const localTheme = localStorage.getItem('theme') as Theme | undefined;

    if (cookieTheme && cookieTheme !== localTheme && ['light', 'dark', 'system'].includes(cookieTheme)) {
      console.log(`[ThemeProvider] Syncing cookie theme ('${cookieTheme}') to localStorage.`);
      localStorage.setItem('theme', cookieTheme);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingStore && currentStoreTheme) {
      console.log('[ThemeProvider] Syncing store theme to document:', currentStoreTheme);
      updateDocumentClass(currentStoreTheme as Theme);
    }
  }, [currentStoreTheme, isLoadingStore, updateDocumentClass]);

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
