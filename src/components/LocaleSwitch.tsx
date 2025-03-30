import React from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';
import { useTranslation } from '~/utils/i18n';

/**
 * A component for switching between supported locales
 * Displays flags and language names for each locale option
 */
export function LocaleSwitch() {
  const { locale, locales, changeLocale, t } = useTranslation();
  
  // Map locale codes to flag emojis (or use a proper flag icon library in a real app)
  const localeFlags: Record<string, string> = {
    en: '🇺🇸',
    vi: '🇻🇳',
  };
  
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button 
          variant="light"
          startContent={localeFlags[locale] || '🌐'}
          endContent={<span className="text-xs ml-1">▼</span>}
          className="min-w-unit-24"
        >
          {locales[locale as keyof typeof locales]}
        </Button>
      </DropdownTrigger>
      <DropdownMenu 
        aria-label={t('settings.selectLanguage')}
        selectionMode="single"
        selectedKeys={[locale]}
        onAction={(key) => changeLocale(key as string)}
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

export default LocaleSwitch; 