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
import { Globe } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import { useConfigStore } from '~/store';
import { useI18n } from '~/components/providers/I18nProvider';
import type { AppLocale } from '~/i18n/locales';

// Define the mapping from locale code to details here
const localeDetailsMap: Record<AppLocale, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇺🇸' },
  vi: { name: 'Tiếng Việt', flag: '🇻🇳' },
};

interface LocaleSelectorProps {
  variant?: 'default' | 'mini';
  className?: string;
}

/**
 * Locale selector component that synchronizes currency with locale
 */
export const LocaleSelector: React.FC<LocaleSelectorProps> = ({
  variant = 'default',
  className = '',
}) => {
  const { t, locales } = useTranslation();
  const { settings } = useConfigStore();
  const { changeLocale } = useI18n();

  const currentLocale = settings?.locale || 'vi';

  const handleLocaleChange = useCallback(
    (locale: AppLocale) => {
      if (locale !== currentLocale) {
        changeLocale(locale);
      }
    },
    [currentLocale, changeLocale]
  );

  if (variant === 'mini') {
    return (
      <Dropdown>
        <DropdownTrigger>
          <Button
            isIconOnly
            variant="light"
            aria-label={t('settings.selectLanguage')}
            className={className}
          >
            <Globe size={20} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label={t('settings.selectLanguage')}
          onAction={(key) => handleLocaleChange(key as AppLocale)}
        >
          {Object.entries(localeDetailsMap).map(([key, { name, flag }]) => (
            <DropdownItem
              key={key}
              description={flag}
              className={currentLocale === key ? 'bg-primary-100 dark:bg-primary-900/20' : ''}
            >
              {name}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    );
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="light"
          startContent={<Globe size={20} />}
          endContent={
            <span className="text-lg">{localeDetailsMap[currentLocale as AppLocale]?.flag || '🌐'}</span>
          }
          className={className}
        >
          {localeDetailsMap[currentLocale as AppLocale]?.name || t('settings.selectLanguage')}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={t('settings.selectLanguage')}
        onAction={(key) => handleLocaleChange(key as AppLocale)}
      >
        {Object.entries(localeDetailsMap).map(([key, { name, flag }]) => (
          <DropdownItem
            key={key}
            startContent={<span className="text-lg">{flag}</span>}
            className={currentLocale === key ? 'bg-primary-100 dark:bg-primary-900/20' : ''}
          >
            {name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};
