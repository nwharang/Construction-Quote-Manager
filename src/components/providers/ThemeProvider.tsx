import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);

  // Fetch user's theme preference
  const { data: settings } = api.settings.get.useQuery(undefined, {
    enabled: !!session,
  });

  // Update theme when settings change
  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme as Theme);
      updateTheme(settings.theme as Theme);
    }
  }, [settings?.theme]);

  // Update theme when system preference changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      setIsDark(mediaQuery.matches);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [theme]);

  // Update theme when theme changes
  useEffect(() => {
    updateTheme(theme);
  }, [theme]);

  const updateTheme = (newTheme: Theme) => {
    if (newTheme === 'system') {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      setIsDark(newTheme === 'dark');
    }

    // Update document class
    document.documentElement.classList.remove('light', 'dark');
    if (newTheme === 'system') {
      document.documentElement.classList.add(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      );
    } else {
      document.documentElement.classList.add(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 