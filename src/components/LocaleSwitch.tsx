"use client"

import React, { useCallback } from 'react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Select,
  SelectItem,
} from '@heroui/react';
import { useTranslation } from '~/utils/i18n';
import { useI18n } from './providers/I18nProvider';
import { useConfigStore } from '~/store';

interface LocaleSwitchProps {
  /**
   * The variant of the component to display
   * @default "dropdown"
   */
  variant?: 'dropdown' | 'select';

  /**
   * Optional class name for the component
   */
  className?: string;

  /**
   * Optional label for the select variant
   * @default "Language"
   */
  label?: string;

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
  onLocaleChange?: (newLocale: string) => void;

  /**
   * Optional value to override the current locale (used with applyImmediately=false)
   * This allows the settings page to control the displayed value
   */
  value?: string;
}

/**
 * A component for switching between supported locales
 * Displays flags and language names for each locale option
 *
 * @example
 * // Dropdown variant (default) for navbar - applies changes immediately
 * <LocaleSwitch />
 *
 * @example
 * // Select variant for settings page - defers changes until form submission
 * <LocaleSwitch
 *   variant="select"
 *   className="w-40"
 *   applyImmediately={false}
 *   value={localSettings.locale}
 *   onLocaleChange={(locale) => handleSettingChange('locale', locale)}
 * />
 */
export function LocaleSwitch({
  variant = 'dropdown',
  className = '',
  label = 'Language',
  applyImmediately = true,
  onLocaleChange,
  value,
}: LocaleSwitchProps) {
  const { t, locales } = useTranslation();
  const { currentLocale, changeLocale } = useI18n();
  const { setSettings } = useConfigStore();

  // Map locale codes to flag emojis (or use a proper flag icon library in a real app)
  const localeFlags: Record<string, string> = {
    en: '🇺🇸',
    vi: '🇻🇳',
    es: '🇪🇸',
  };

  // Memoize the handler to avoid recreating it on each render
  const handleLocaleChange = useCallback(
    (locale: string) => {
      // Prevent unnecessary updates if the locale is already set
      if (locale === currentLocale) {
        return;
      }

      if (applyImmediately) {
        // Apply changes immediately (for navbar)
        changeLocale(locale);

        // Also update in settings store for consistency
        setSettings({ locale });
      } else if (onLocaleChange) {
        // Defer changes to parent component (for settings page)
        onLocaleChange(locale);
      }
    },
    [currentLocale, changeLocale, setSettings, applyImmediately, onLocaleChange]
  );

  // Handler for dropdown selection
  const handleDropdownAction = useCallback(
    (key: React.Key) => {
      handleLocaleChange(key as string);
    },
    [handleLocaleChange]
  );

  // Handler for select change
  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      handleLocaleChange(e.target.value);
    },
    [handleLocaleChange]
  );

  // Get the display locale - either from prop value, or from current app locale
  const displayLocale = value || currentLocale;

  // Render as dropdown (for navbar)
  if (variant === 'dropdown') {
    return (
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant="light"
            startContent={localeFlags[displayLocale] || '🌐'}
            endContent={<span className="ml-1 text-xs">▼</span>}
            className={`min-w-unit-24 ${className}`}
          >
            {locales[displayLocale as keyof typeof locales]}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label={t('settings.selectLanguage')}
          selectionMode="single"
          selectedKeys={[displayLocale]}
          onAction={handleDropdownAction}
          disallowEmptySelection
        >
          {Object.entries(locales).map(([code, name]) => (
            <DropdownItem
              key={code}
              startContent={<span className="mr-2">{localeFlags[code] || '🌐'}</span>}
            >
              {name}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    );
  }

  // Render as select (for settings page)
  return (
    <Select
      label={label}
      aria-label={t('settings.selectLanguage')}
      className={className}
      selectedKeys={[displayLocale]}
      onChange={(e) => handleLocaleChange(e.target.value)}
      variant="bordered"
      renderValue={(items) => {
        return items.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            {localeFlags[item.key as string] && <span>{localeFlags[item.key as string]}</span>}
            <span>{locales[item.key as keyof typeof locales]}</span>
          </div>
        ));
      }}
    >
      {Object.entries(locales).map(([code, name]) => (
        <SelectItem
          key={code}
          textValue={name}
          startContent={<span className="mr-2">{localeFlags[code] || '🌐'}</span>}
        >
          {name}
        </SelectItem>
      ))}
    </Select>
  );
}

export default LocaleSwitch;
