import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import { useConfigStore, type Settings } from '~/store/configStore'; // Import Settings type
import Cookies from 'js-cookie';
import { type AppLocale, isSupportedLocale } from '~/i18n/locales';

/**
 * ConfigLoader Component
 *
 * This component is responsible for:
 * 1. Fetching user settings from the database (if logged in) and hydrating the useConfigStore
 * 2. Loading settings from localStorage/cookies for unauthenticated users
 *
 * It doesn't render any UI itself.
 */

// Define Theme type locally if not imported
type Theme = 'light' | 'dark' | 'system';
const themeCookieKey = 'app-theme';
const localeCookieKey = 'app-locale';

// Valid theme values for type checking
const VALID_THEMES: Theme[] = ['light', 'dark', 'system'];

// Define default settings matching the Settings type structure
// (Derived from inferRouterOutputs<AppRouter>['settings']['get'])
const defaultSettingsData: Settings = {
  id: 'default-settings-placeholder', // Placeholder ID
  userId: 'default-user-placeholder', // Placeholder user ID
  companyName: 'My Company',
  companyEmail: 'default@example.com',
  companyPhone: null,
  companyAddress: null,
  // Use strings for numeric-like fields as expected by Settings type from `settings.get`
  emailNotifications: true,
  quoteNotifications: true,
  taskNotifications: true,
  theme: 'system', // Default theme
  locale: 'en', // Default locale
  currency: 'USD',
  currencySymbol: '$',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  createdAt: new Date(), // Placeholder date
  updatedAt: new Date(), // Placeholder date
};

export function ConfigLoader() {
  const { status } = useSession();
  const { setSettings } = useConfigStore();
  const initialized = useRef(false);

  // Fetch DB settings only if authenticated
  const { data: dbSettings, isLoading: isLoadingDbSettings } = api.settings.get.useQuery(
    undefined,
    {
      enabled: status === 'authenticated',
      refetchOnWindowFocus: false,
      staleTime: Infinity, // Cache indefinitely until invalidated
    }
  );

  // Load settings from localStorage/cookies
  const loadLocalSettings = useCallback(() => {
    // Only run in client
    if (typeof window === 'undefined') return null;

    // Get theme from cookie or localStorage with proper validation
    const rawTheme = Cookies.get(themeCookieKey) || localStorage.getItem('theme');
    // Validate that theme is one of the allowed values
    const theme =
      rawTheme && VALID_THEMES.includes(rawTheme as Theme)
        ? (rawTheme as Theme)
        : defaultSettingsData.theme;

    // Get locale from cookie or localStorage with validation
    const rawLocale = Cookies.get(localeCookieKey) || localStorage.getItem('locale');
    // Validate that locale is supported
    const locale =
      rawLocale && isSupportedLocale(rawLocale) ? rawLocale : defaultSettingsData.locale;

    // Create partial settings object with client preferences
    return {
      ...defaultSettingsData,
      theme,
      locale,
    };
  }, []);

  // Main effect for loading settings
  useEffect(() => {
    const isUserLoading = status === 'loading';
    const areSettingsLoading = status === 'authenticated' && isLoadingDbSettings;

    // Still show loading state initially
    if (isUserLoading || areSettingsLoading) {
      if (useConfigStore.getState().isLoading) {
        // If already loading, do nothing
      } else {
        useConfigStore.setState({ isLoading: true });
      }
      return;
    }

    // --- Hydrate if authenticated and settings loaded ---
    if (status === 'authenticated' && dbSettings) {
      console.log('[ConfigLoader] Hydrating store with fetched DB settings.');
      setSettings({ ...dbSettings }); // Hydrate with DB settings
      initialized.current = true;
    }
    // --- For unauthenticated users, load from localStorage/cookies ---
    else if (status === 'unauthenticated') {
      console.log(
        '[ConfigLoader] User unauthenticated, loading settings from localStorage/cookies.'
      );
      const localSettings = loadLocalSettings();

      if (localSettings) {
        // Only set if we successfully loaded local settings
        setSettings(localSettings);
      }

      // Always ensure loading is set to false for unauthenticated users
      if (useConfigStore.getState().isLoading) {
        useConfigStore.setState({ isLoading: false });
      }

      initialized.current = true;
    }
  }, [status, dbSettings, isLoadingDbSettings, setSettings, loadLocalSettings]);

  // This component doesn't render anything
  return null;
}
