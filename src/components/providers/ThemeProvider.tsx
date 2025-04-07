'use client';

import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useConfigStore } from '~/store';

// Client component that manages smooth theme transitions
function TransitionManager() {
  const { resolvedTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Add/remove transition classes on theme change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Apply theme transition class to enable transitions
      document.documentElement.classList.add('theme-transition');
      
      // When a theme change is detected, temporarily disable transitions
      // This prevents flash on initial render
      if (resolvedTheme) {
        setIsTransitioning(true);
        document.documentElement.classList.add('disable-transitions');
        
        // Remove the disable class after the theme has been applied
        const timeoutId = setTimeout(() => {
          document.documentElement.classList.remove('disable-transitions');
          setIsTransitioning(false);
        }, 100); // Short delay allows theme to apply without transition
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [resolvedTheme]);
  
  return null;
}

// Client component that observes theme changes
function ThemeObserver() {
  const { theme, resolvedTheme } = useTheme();
  const { settings, setSettings } = useConfigStore();
  
  // Use the resolvedTheme to sync with the store
  // This ensures system preference changes are captured
  useEffect(() => {
    if (resolvedTheme && settings) {
      // Only update if the theme has actually changed
      if (settings.theme !== resolvedTheme && 
          (resolvedTheme === 'dark' || resolvedTheme === 'light')) {
        console.log('[ThemeObserver] Syncing resolved theme to store:', resolvedTheme);
        setSettings({ theme: resolvedTheme });
      }
    }
  }, [resolvedTheme, settings, setSettings]);
  
  // Also listen for explicit theme changes
  useEffect(() => {
    if (theme && settings && theme !== 'system') {
      // Only update if the theme has actually changed
      if (settings.theme !== theme) {
        console.log('[ThemeObserver] Syncing selected theme to store:', theme);
        setSettings({ theme });
        
        // Dispatch an event that can be detected by other components
        document.dispatchEvent(
          new CustomEvent('theme-change', { detail: { theme } })
        );
      }
    }
  }, [theme, settings, setSettings]);
  
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useConfigStore();
  
  // Use the store's theme setting or fall back to system
  const initialTheme = useMemo(() => settings?.theme || 'system', [settings?.theme]);
  
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      value={{
        dark: 'dark',
        light: 'light',
        system: 'system'
      }}
      enableSystem
      disableTransitionOnChange={false} // Let our custom transition manager handle this
      storageKey="app-theme"
      forcedTheme={undefined}  // Never force a theme, allow user choice
      themes={['light', 'dark', 'system']}
    >
      <ThemeObserver />
      <TransitionManager />
      {children}
    </NextThemesProvider>
  );
}

// Re-export the useTheme hook from next-themes
export { useTheme };
