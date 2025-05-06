'use client';

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
import { useTranslation } from '~/hooks/useTranslation';
import { useI18n } from '~/components/providers/I18nProvider';
import { Globe } from 'lucide-react';
import type { AppLocale } from '~/i18n/locales';

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
  onLocaleChange?: (newLocale: AppLocale) => void;

  /**
   * Optional value to override the current locale (used with applyImmediately=false)
   * This allows the settings page to control the displayed value
   */
  value?: AppLocale;
}

/**
 * A component for switching between supported locales
 * Displays flags and language names for each locale option
 * Automatically synchronizes currency with the selected locale
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
  label,
  applyImmediately = true,
  onLocaleChange,
  value,
}: LocaleSwitchProps) {
  const { t, locales } = useTranslation();
  const { currentLocale: contextLocale, changeLocale } = useI18n();

  // Map locale codes to flag emojis (or use a proper flag icon library in a real app)
  const effectiveLocale = value !== undefined ? value : contextLocale;
  const localeFlags: Record<string, string> = {
    en: '🇺🇸',
    vi: '🇻🇳',
  };

  // Memoize the handler to avoid recreating it on each render
  const handleLocaleChange = useCallback(
    (localeKey: string) => {
      const appLocale = localeKey as AppLocale;

      // Prevent unnecessary updates
      if (appLocale === effectiveLocale) {
        return;
      }

      if (applyImmediately) {
        changeLocale(appLocale);
      } else if (onLocaleChange) {
        onLocaleChange(appLocale);
      }
    },
    [effectiveLocale, changeLocale, applyImmediately, onLocaleChange]
  );

  // Add a check here: If locales is not ready, don't render anything
  if (!locales) {
    return null;
  }

  // Render as dropdown (for navbar)
  if (variant === 'dropdown') {
    return (
      <Dropdown>
        <DropdownTrigger>
          <Button isIconOnly variant="light" aria-label={t('settings.selectLanguage')}>
            <Globe size={20} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label={t('settings.language')}
          selectionMode="single"
          selectedKeys={effectiveLocale ? [effectiveLocale] : []}
          onSelectionChange={(keys) => {
            // Cast properly and handle with more robustness
            const selectedKeys = keys as Set<string>;
            if (selectedKeys && selectedKeys.size > 0) {
              const selectedLocaleArray = Array.from(selectedKeys);
              if (selectedLocaleArray.length > 0) {
                const selectedLocale = selectedLocaleArray[0];
                if (selectedLocale) {
                  // Prevent the event from continuing to bubble up
                  handleLocaleChange(selectedLocale);
                }
              }
            }
          }}
        >
          {Object.entries(locales).map(([code, { name, flag }]) => (
            <DropdownItem key={code} textValue={name}>
              <div className="flex items-center">
                <span className="mr-2 text-lg" role="img" aria-label={`${name} flag`}>
                  {localeFlags[code]}
                </span>
                {name}
              </div>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    );
  }

  // Render as select (for settings page)
  return (
    <Select
      label={label || t('settings.language')}
      selectedKeys={effectiveLocale ? [effectiveLocale] : []}
      onSelectionChange={(keys) => {
        // Cast properly and handle with more robustness
        const selectedKeys = keys as Set<string>;
        if (selectedKeys && selectedKeys.size > 0) {
          const selectedLocaleArray = Array.from(selectedKeys);
          if (selectedLocaleArray.length > 0) {
            const selectedLocale = selectedLocaleArray[0];
            if (selectedLocale) {
              // Prevent the event from continuing to bubble up
              handleLocaleChange(selectedLocale);
            }
          }
        }
      }}
      className={className}
      aria-label={label || t('settings.selectLanguage')}
    >
      {Object.entries(locales).map(([code, { name, flag }]) => (
        <SelectItem key={code} textValue={name}>
          <div className="flex items-center">
            <span className="mr-2 text-lg" role="img" aria-label={`${name} flag`}>
              {localeFlags[code]}
            </span>
            {name}
          </div>
        </SelectItem>
      ))}
    </Select>
  );
}
