import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import { type SupportedLocale } from '~/i18n/locales';
import { useConfigStore } from '~/store';

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
  const { isDarkMode, setSettings } = useConfigStore();
  const [isChangingTheme, setIsChangingTheme] = useState(false);

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
      api.useUtils().settings.get.invalidate();
    },
  });

  // Function to set theme and persist it
  const setTheme = (newTheme: Theme) => {
    // Prevent recursive updates
    if (isChangingTheme) return;
    
    setIsChangingTheme(true);
    setThemeState(newTheme);
    
    // Update the configStore
    const isNewThemeDark = newTheme === 'dark' || (newTheme === 'system' && 
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // First update the theme in settings
    if (newTheme !== settings?.theme) {
      setSettings({ theme: newTheme });
    }
    
    // Then update the isDarkMode state separately if needed
    if (isNewThemeDark !== isDarkMode) {
      // This is a direct update to the zustand store state, not through setSettings
      useConfigStore.setState({ isDarkMode: isNewThemeDark });
    }
    
    // Update document class immediately
    updateDocumentClass(newTheme === 'system' 
      ? (isNewThemeDark ? 'dark' : 'light') 
      : newTheme);
    
    if (session && settings) {
      // Save to server
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
    }
    
    // Always save to localStorage too for quick access on page load
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    
    // Reset flag after a short delay
    setTimeout(() => {
      setIsChangingTheme(false);
    }, 200);
  };

  // Early check for dark mode preference on mount
  useEffect(() => {
    // This runs on first client-side render and reads what was set in _document.tsx
    if (typeof window !== 'undefined' && !isInitialized) {
      const isDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(isDarkClass);
    }
  }, [isInitialized]);

  // Initialize theme from settings or localStorage - run only once
  useEffect(() => {
    if (!isInitialized) {
      const initializeTheme = () => {
        let initialTheme: Theme = 'system';
        
        // Priority: 1. User settings (when logged in), 2. localStorage, 3. System preference
        if (settings?.theme) {
          initialTheme = settings.theme as Theme;
        } else if (typeof window !== 'undefined') {
          const savedTheme = localStorage.getItem('theme') as Theme | null;
          if (savedTheme) {
            initialTheme = savedTheme;
          }
        }
        
        setThemeState(initialTheme);
        
        // Also check current dark mode status
        if (initialTheme === 'system' && typeof window !== 'undefined') {
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDark(systemDark);
          updateDocumentClass(systemDark ? 'dark' : 'light');
        } else {
          setIsDark(initialTheme === 'dark');
          updateDocumentClass(initialTheme);
        }
        
        setIsInitialized(true);
      };

      // Initialize immediately if settings are available or no session
      if (settings || status !== 'loading') {
        initializeTheme();
      }
    }
  }, [settings, status, isInitialized]);

  // Sync with configStore
  useEffect(() => {
    if (isInitialized && !isChangingTheme) {
      const isCurrentDark = theme === 'dark' || 
        (theme === 'system' && typeof window !== 'undefined' && 
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      // Only update if there's an actual difference and we're not in the middle of a change
      if (isCurrentDark !== isDarkMode && theme !== 'system' && settings?.theme !== theme) {
        setIsChangingTheme(true);
        setSettings({ theme });
        setTimeout(() => {
          setIsChangingTheme(false);
        }, 200);
      }
    }
  }, [isInitialized, theme, isDarkMode]);

  // Update theme when system preference changes
  useEffect(() => {
    if (theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
        updateDocumentClass(e.matches ? 'dark' : 'light');
        
        // Only update configStore if actually needed and not changing theme already
        if (e.matches !== isDarkMode && !isChangingTheme && settings?.theme === 'system') {
          setIsChangingTheme(true);
          // Just update isDark state without changing the theme setting
          setTimeout(() => {
            setIsChangingTheme(false);
          }, 200);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      setIsDark(mediaQuery.matches);
      updateDocumentClass(mediaQuery.matches ? 'dark' : 'light');

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [theme, isDarkMode, isChangingTheme]);

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