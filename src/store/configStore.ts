import { create } from 'zustand';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';

type Settings = inferRouterOutputs<AppRouter>['settings']['get'];

type Theme = 'light' | 'dark' | 'system';

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
      let updatedSettings: Settings | null = null; // Initialize as null
      let updatedIsLoading = state.isLoading; // Default to current loading state

      if (state.settings === null || ('id' in newSettingsOrFull && newSettingsOrFull.id)) {
        // Handle initial hydration or explicit full replacement
        if (!('id' in newSettingsOrFull)) {
          return {}; // Should not happen if ConfigLoader is correct
        }
        updatedSettings = newSettingsOrFull as Settings;
        updatedIsLoading = false; // Mark loading as complete on hydration
      } else if (state.settings) {
        // Handle partial update
        updatedSettings = {
          ...state.settings,
          ...(newSettingsOrFull as Partial<Settings>), // Cast to Partial
        };
        // isLoading remains unchanged during partial updates
      } else {
        return {};
      }

      // Ensure updatedSettings is not null before proceeding
      if (updatedSettings === null) {
        return {}; // Prevent further processing with null settings
      }

      // Calculate isDarkMode based on the potentially updated theme
      const potentialNextTheme = updatedSettings.theme;
      const updatedIsDarkMode =
        potentialNextTheme === 'dark' ||
        (potentialNextTheme === 'system' &&
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      const newStateSlice = {
        settings: updatedSettings, // Now guaranteed non-null
        isDarkMode: updatedIsDarkMode,
        isLoading: updatedIsLoading, // Include isLoading in the returned slice
      };

      return newStateSlice;
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setUpdating: (isUpdating) => set({ isUpdating }),

  toggleNav: () =>
    set((state) => ({
      isNavOpen: !state.isNavOpen,
    })),

  toggleDarkMode: () =>
    set((state) => {
      if (!state?.settings) return {};
      const currentTheme = state.settings.theme;
      const nextTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';

      const isNextDark = nextTheme === 'dark';

      return {
        settings: { ...state.settings, theme: nextTheme },
        isDarkMode: isNextDark,
      };
    }),
}));

export type { Settings };
