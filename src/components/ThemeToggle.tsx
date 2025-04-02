'use client';

import React from 'react';
import { Button } from '@heroui/react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import { useTheme } from '~/components/providers/ThemeProvider';

type Theme = 'light' | 'dark' | 'system';

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
  onThemeChange?: (newTheme: Theme) => void;

  /**
   * Optional value to override the current theme (used with applyImmediately=false)
   * This allows the settings page to control the displayed value
   */
  value?: Theme;

  /**
   * Optional size for the button component
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A component for cycling between light, dark, and system themes using an icon button.
 *
 * @example
 * // Default for navbar - applies changes immediately
 * <ThemeToggle />
 *
 * @example
 * // Settings page - defers changes until form submission
 * <ThemeToggle
 *   applyImmediately={false}
 *   value={localSettings.theme}
 *   onThemeChange={(newTheme) => handleSettingChange('theme', newTheme)}
 * />
 */
export function ThemeToggle({
  applyImmediately = true,
  onThemeChange,
  value,
  size = 'md',
}: ThemeToggleProps) {
  const { t } = useTranslation();
  const { theme: contextTheme, setTheme } = useTheme();

  const currentTheme = value !== undefined ? value : contextTheme;

  const getNextTheme = (current: Theme): Theme => {
    if (current === 'light') return 'dark';
    if (current === 'dark') return 'system';
    return 'light';
  };

  const handleClick = () => {
    const nextTheme = getNextTheme(currentTheme);
    if (applyImmediately) {
      setTheme(nextTheme);
    } else if (onThemeChange) {
      onThemeChange(nextTheme);
    }
  };

  const renderIcon = () => {
    switch (currentTheme) {
      case 'light':
        return <Sun size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />;
      case 'dark':
        return <Moon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />;
      case 'system':
      default:
        return <Monitor size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />;
    }
  };

  return (
    <Button
      size={size}
      variant="ghost"
      isIconOnly
      onClick={handleClick}
      aria-label={t('settings.changeTheme')}
      title={t('settings.changeThemeTitle', { theme: currentTheme }) as string}
    >
      {renderIcon()}
    </Button>
  );
}
