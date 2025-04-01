'use client';

import React from 'react';
import { Switch } from '@heroui/react';
import { useTranslation } from '~/utils/i18n';
import { useConfigStore } from '~/store';
import { useTheme } from '~/components/providers/ThemeProvider';

interface ThemeToggleProps {
  /**
   * Determines if changes should be applied immediately
   * Set to false for settings page where changes are applied on save
   * @default true
   */
  applyImmediately?: boolean;

  /**
   * Optional callback for deferred changes (used in settings page)
   * This will be called instead of applying the change directly when applyImmediately is false
   */
  onThemeChange?: (isDark: boolean) => void;

  /**
   * Optional value to override the current theme (used with applyImmediately=false)
   * This allows the settings page to control the displayed value
   */
  value?: boolean;

  /**
   * Optional size for the switch component
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A component for toggling between light and dark theme
 *
 * @example
 * // Default for navbar - applies changes immediately
 * <ThemeToggle />
 *
 * @example
 * // Settings page - defers changes until form submission
 * <ThemeToggle
 *   applyImmediately={false}
 *   value={localSettings.isDarkMode}
 *   onThemeChange={(isDark) => handleSettingChange('isDarkMode', isDark)}
 * />
 */
export function ThemeToggle({
  applyImmediately = true,
  onThemeChange,
  value,
  size = 'md',
}: ThemeToggleProps) {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useConfigStore();
  const { setTheme } = useTheme();

  // Use the provided value if available, otherwise use the store value
  const isSelected = value !== undefined ? value : isDarkMode;

  const handleToggle = (checked: boolean) => {
    if (applyImmediately) {
      // Update the config store state
      toggleDarkMode();

      // Update the theme provider - need to use the opposite of current state
      setTheme(isDarkMode ? 'light' : 'dark');
    } else if (onThemeChange) {
      // Defer changes to parent component (for settings page)
      onThemeChange(checked);
    }
  };

  return (
    <Switch
      size={size}
      color="primary"
      isSelected={isSelected}
      onValueChange={handleToggle}
      aria-label={t('settings.toggleTheme')}
    />
  );
}

export default ThemeToggle;
