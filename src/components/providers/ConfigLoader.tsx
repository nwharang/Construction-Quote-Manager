import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import { useConfigStore, type Settings } from '~/store/configStore'; // Import Settings type

/**
 * ConfigLoader Component
 *
 * This component is responsible for fetching user settings from the database
 * (if logged in) and hydrating the useConfigStore on initial application load.
 * It doesn't render any UI itself.
 */

// Define Theme type locally if not imported
type Theme = 'light' | 'dark' | 'system';

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
  defaultComplexityCharge: 0,
  defaultMarkupCharge: 0,
  defaultTaskPrice: 0,
  defaultMaterialPrice: 0,
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
      // Removed onSuccess/onError, handle in useEffect
    }
  );

  useEffect(() => {
    if (initialized.current) return;

    const isUserLoading = status === 'loading';
    const areSettingsLoading = status === 'authenticated' && isLoadingDbSettings;

    // Still show loading state initially
    if (isUserLoading || areSettingsLoading) {
      // Only set loading true initially if it's not already true
      if (!useConfigStore.getState().isLoading) {
        useConfigStore.setState({ isLoading: true }); // Use direct setState here for simplicity
      }
      return;
    }

    // --- Determine Final Settings ---
    let finalSettings: Settings;

    if (status === 'authenticated' && dbSettings) {
      finalSettings = dbSettings;
    } else {
      finalSettings = { ...defaultSettingsData }; // Clone defaults

      // Apply localStorage override if applicable
      if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
          finalSettings.theme = storedTheme as Theme;
        }
      }
    }

    // --- Single Hydration Call ---
    setSettings(finalSettings);

    initialized.current = true;
  }, [status, dbSettings, isLoadingDbSettings, setSettings]); // Removed setLoading from dependencies

  // This component doesn't render anything
  return null;
}
