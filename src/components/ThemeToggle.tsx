import React from 'react';
import { Switch } from '@heroui/react';
import { useTranslation } from '~/utils/i18n';
import { useConfigStore } from '~/store';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useConfigStore();
  
  const handleToggle = () => {
    toggleDarkMode();
    // HeroUI theme is handled by the configStore
  };
  
  return (
    <Switch
      size="lg"
      color="primary"
      isSelected={isDarkMode}
      onValueChange={handleToggle}
      aria-label={t('settings.toggleTheme')}
      endContent={<span>{isDarkMode ? t('theme.dark') : t('theme.light')}</span>}
    />
  );
}

export default ThemeToggle; 