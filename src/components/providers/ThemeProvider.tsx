'use client';

import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useConfigStore } from '~/store';

// Client component that observes theme changes
function ThemeObserver() {
  const { theme, resolvedTheme } = useTheme();
  const { settings, setSettings } = useConfigStore();

  // Use the resolvedTheme to sync with the store
  // This ensures system preference changes are captured
  useEffect(() => {
    if (resolvedTheme && settings) {
      // Only update if the theme has actually changed
      if (
        settings.theme !== resolvedTheme &&
        (resolvedTheme === 'dark' || resolvedTheme === 'light')
      ) {
        setSettings({ theme: resolvedTheme });
      }
    }
  }, [resolvedTheme, settings, setSettings]);

  // Also listen for explicit theme changes
  useEffect(() => {
    if (theme && settings && theme !== 'system') {
      // Only update if the theme has actually changed
      if (settings.theme !== theme) {
        setSettings({ theme });

        // Dispatch an event that can be detected by other components
        document.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }));
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
        system: 'system',
      }}
      enableSystem
      disableTransitionOnChange={false} // Let our custom transition manager handle this
      storageKey="app-theme"
      forcedTheme={undefined} // Never force a theme, allow user choice
      themes={['light', 'dark', 'system']}
    >
      <ThemeObserver />
      {children}
    </NextThemesProvider>
  );
}

// Re-export the useTheme hook from next-themes
export { useTheme };
