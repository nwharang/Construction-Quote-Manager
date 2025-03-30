/**
 * @deprecated Use the useConfigStore from '~/store' directly
 * This is a compatibility layer for old code that still uses useSettings
 */

import { useConfigStore } from '~/store';
import type { Settings } from '~/types';

export function useSettings() {
  const { 
    settings, 
    setSettings, 
    isLoading, 
    isUpdating,
    setLoading,
    setUpdating
  } = useConfigStore();

  // Compatibility with old API
  return {
    settings,
    isLoading,
    updateSettings: (newSettings: Partial<Settings>) => {
      setSettings(newSettings);
    },
    isSaving: isUpdating,
    setIsSaving: setUpdating,
  };
}

export default useSettings; 