import { create } from 'zustand';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import { DEFAULT_LOCALE } from '~/i18n/locales';

type Settings = inferRouterOutputs<AppRouter>['settings']['get'];

type Theme = 'light' | 'dark' | 'system';

// Default settings structure - use actual defaults
const defaultSettingsData: Settings = {
  id: 'default',
  userId: 'default-user',
  companyName: null,
  companyEmail: null,
  companyPhone: null,
  companyAddress: null,
  emailNotifications: true,
  quoteNotifications: true,
  taskNotifications: true,
  theme: 'system',
  locale: DEFAULT_LOCALE,
  currency: 'USD',
  dateFormat: 'DD/MM/YYYY',
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface ConfigState {
  settings: Settings | null;
  isLoading: boolean;
  isUpdating: boolean;

  isNavOpen: boolean;
  isDarkMode: boolean;

  setSettings: (settings: Partial<Settings> | Settings) => void;
  setLoading: (isLoading: boolean) => void;
  setUpdating: (isUpdating: boolean) => void;
  toggleNav: () => void;
  toggleDarkMode: () => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  settings: null,
  isLoading: true,
  isUpdating: false,
  isNavOpen: false,
  isDarkMode: false,

  setSettings: (newSettingsOrFull: Partial<Settings> | Settings) =>
    set((state) => {
      const isFullHydration = 'id' in newSettingsOrFull && !!newSettingsOrFull.id;

      let newStateSlice = {};

      if (isFullHydration) {
        const fullSettings = newSettingsOrFull as Settings;

        const potentialNextTheme = fullSettings.theme;
        const updatedIsDarkMode =
          potentialNextTheme === 'dark' ||
          (potentialNextTheme === 'system' &&
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

        newStateSlice = {
          settings: fullSettings,
          isDarkMode: updatedIsDarkMode,
          isLoading: false,
        };
      } else if (state.settings) {
        const partialSettings = newSettingsOrFull as Partial<Settings>;
        const updatedSettings = {
          ...state.settings,
          ...partialSettings,
        };

        let updatedIsDarkMode = state.isDarkMode;
        if ('theme' in partialSettings) {
          const potentialNextTheme = partialSettings.theme;
          updatedIsDarkMode =
            potentialNextTheme === 'dark' ||
            (potentialNextTheme === 'system' &&
              typeof window !== 'undefined' &&
              window.matchMedia('(prefers-color-scheme: dark)').matches);
        }

        newStateSlice = {
          settings: updatedSettings,
          isDarkMode: updatedIsDarkMode,
        };
      } else {
         console.warn('[ConfigStore] setSettings called with partial update before full hydration. Ignoring.', newSettingsOrFull);
        newStateSlice = {};
      }
      return newStateSlice;
    }),

  setLoading: (isLoading) => set((state) => {
    return { isLoading };
  }),

  setUpdating: (isUpdating) => set({ isUpdating }),

  toggleNav: () =>
    set((state) => ({
      isNavOpen: !state.isNavOpen,
    })),

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));

export type { Settings };
