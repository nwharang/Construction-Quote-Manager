import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import { type SupportedLocale } from '~/i18n/locales';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [theme, setThemeState] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user's theme preference only when logged in
  const { data: settings } = api.settings.get.useQuery(undefined, {
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for garbage collection for 10 minutes
  });

  // Settings mutation to save theme preference
  const updateSettingsMutation = api.settings.update.useMutation({
    // When the mutation succeeds, invalidate the settings query to refresh the cache
    onSuccess: () => {
      api.useContext().settings.get.invalidate();
    },
  });

  // Function to set theme and persist it
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (session && settings) {
      // Convert settings properties to match expected input type
      updateSettingsMutation.mutate({
        companyName: settings.companyName,
        companyEmail: settings.companyEmail,
        companyPhone: settings.companyPhone || undefined,
        companyAddress: settings.companyAddress || undefined,
        defaultComplexityCharge: parseFloat(settings.defaultComplexityCharge),
        defaultMarkupCharge: parseFloat(settings.defaultMarkupCharge),
        defaultTaskPrice: parseFloat(settings.defaultTaskPrice),
        defaultMaterialPrice: parseFloat(settings.defaultMaterialPrice),
        emailNotifications: settings.emailNotifications,
        quoteNotifications: settings.quoteNotifications,
        taskNotifications: settings.taskNotifications,
        theme: newTheme,
        currency: settings.currency,
        currencySymbol: settings.currencySymbol,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat as "12h" | "24h",
        locale: (settings.locale || 'en') as SupportedLocale,
      });
    } else {
      // If no session, save to localStorage
      localStorage.setItem('theme', newTheme);
    }
  };

  // Initialize theme from settings or localStorage - run only once
  useEffect(() => {
    if (!isInitialized) {
      const initializeTheme = () => {
        if (settings?.theme) {
          setThemeState(settings.theme as Theme);
        } else if (typeof window !== 'undefined') {
          const savedTheme = localStorage.getItem('theme') as Theme | null;
          if (savedTheme) {
            setThemeState(savedTheme);
          }
        }
        setIsInitialized(true);
      };

      // Initialize immediately if settings are available or no session
      if (settings || status !== 'loading') {
        initializeTheme();
      }
    }
  }, [settings, status, isInitialized]);

  // Update theme when system preference changes
  useEffect(() => {
    if (theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
        updateDocumentClass(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      setIsDark(mediaQuery.matches);
      updateDocumentClass(mediaQuery.matches ? 'dark' : 'light');

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [theme]);

  // Update document class when theme changes
  useEffect(() => {
    if (isInitialized) {
      if (theme === 'system') {
        if (typeof window !== 'undefined') {
          const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDark(isDarkMode);
          updateDocumentClass(isDarkMode ? 'dark' : 'light');
        }
      } else {
        setIsDark(theme === 'dark');
        updateDocumentClass(theme);
      }
    }
  }, [theme, isInitialized]);

  const updateDocumentClass = (value: string) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(value);
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