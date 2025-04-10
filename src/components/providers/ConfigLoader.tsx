import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import { useConfigStore, type Settings } from '~/store/configStore'; // Import Settings type
import Cookies from 'js-cookie';
import { type AppLocale, isSupportedLocale, DEFAULT_LOCALE } from '~/i18n/locales';

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

// Cookie keys
const themeCookieKey = 'app-theme';
const localeCookieKey = 'app-locale';

// Allowed themes
const VALID_THEMES: Theme[] = ['light', 'dark', 'system'];

// Define default settings data structure directly here
const defaultSettingsData: Partial<Settings> = {
  // No ID needed for default, it represents non-persisted state
  theme: 'system',
  locale: DEFAULT_LOCALE,
  currency: 'USD', // Default currency
  dateFormat: 'DD/MM/YYYY', // Default date format
  emailNotifications: true,
  quoteNotifications: true,
  taskNotifications: true,
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
    if (typeof window === 'undefined') return null;

    const rawTheme = Cookies.get(themeCookieKey) || localStorage.getItem('theme');
    const theme =
      rawTheme && VALID_THEMES.includes(rawTheme as Theme)
        ? (rawTheme as Theme)
        : defaultSettingsData.theme;

    const rawLocale = Cookies.get(localeCookieKey) || localStorage.getItem('locale');
    const locale =
      rawLocale && isSupportedLocale(rawLocale) ? rawLocale : defaultSettingsData.locale;

    return {
      ...defaultSettingsData,
      theme,
      locale,
    };
  }, []);

  useEffect(() => {
    if (initialized.current || status === 'loading' || isLoadingDbSettings) {
      return;
    }

    const localPreferences = loadLocalSettings() || defaultSettingsData;

    let finalSettings: Settings;

    if (status === 'authenticated' && dbSettings) {
      finalSettings = {
        ...dbSettings,
        theme: localPreferences.theme || dbSettings.theme,
        locale: localPreferences.locale || dbSettings.locale,
      };
    } else {
      finalSettings = {
        ...(defaultSettingsData as Settings), // Need to cast default data
        ...localPreferences,
        id: 'unauthenticated', // Use a placeholder or derive
        userId: 'unauthenticated-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        companyName: null,
        companyEmail: null,
        companyPhone: null,
        companyAddress: null,
      };
    }

    setSettings(finalSettings);
    initialized.current = true;

  }, [status, dbSettings, isLoadingDbSettings, setSettings, loadLocalSettings]);

  // This component doesn't render anything visible
  return null;
}
