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
      console.log('[ConfigStore] setSettings called with:', newSettingsOrFull);

      // Determine if this is the initial full hydration call (assume it has an 'id')
      const isFullHydration = 'id' in newSettingsOrFull && !!newSettingsOrFull.id;

      if (isFullHydration) {
        console.log('[ConfigStore] Handling FULL hydration.');
        const fullSettings = newSettingsOrFull as Settings;

        // Calculate isDarkMode based on the incoming theme
        const potentialNextTheme = fullSettings.theme;
        const updatedIsDarkMode = potentialNextTheme === 'dark' ||
          (potentialNextTheme === 'system' &&
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

        const newStateSlice = {
          settings: fullSettings,
          isDarkMode: updatedIsDarkMode,
          isLoading: false, // *** Set isLoading to false ONLY on full hydration ***
        };
        console.log('[ConfigStore] Returning new state slice (Full Hydration):', newStateSlice);
        return newStateSlice;

      } else if (state.settings) {
        console.log('[ConfigStore] Handling PARTIAL update.');
        // Handle partial update ONLY if settings already exist
        const partialSettings = newSettingsOrFull as Partial<Settings>; // Cast to Partial
        const updatedSettings = {
          ...state.settings,
          ...partialSettings,
        };

        // Recalculate isDarkMode if theme is part of the partial update
        let updatedIsDarkMode = state.isDarkMode;
        if ('theme' in partialSettings) {
          const potentialNextTheme = partialSettings.theme;
          updatedIsDarkMode = potentialNextTheme === 'dark' ||
            (potentialNextTheme === 'system' &&
              typeof window !== 'undefined' &&
              window.matchMedia('(prefers-color-scheme: dark)').matches);
        }

        const newStateSlice = {
          settings: updatedSettings,
          isDarkMode: updatedIsDarkMode,
          // isLoading remains unchanged during partial updates
        };
        console.log('[ConfigStore] Returning new state slice (Partial Update):', newStateSlice);
        return newStateSlice;

      } else {
        // If it's not full hydration and settings are null, it's likely an update attempt before hydration.
        // Log this and do nothing to prevent corrupting the state.
        console.warn('[ConfigStore] Partial update received BEFORE initial hydration. Ignoring:', newSettingsOrFull);
        return {}; // Return empty object, no state change
      }
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
