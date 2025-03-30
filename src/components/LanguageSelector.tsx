import React from 'react';
import { Select, SelectItem } from '@heroui/react';
import { useI18n } from './providers/I18nProvider';

/**
 * Language selector component that allows users to switch languages
 */
export function LanguageSelector() {
  const { currentLocale, availableLocales, changeLocale } = useI18n();
  
  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeLocale(e.target.value);
  };
  
  return (
    <Select
      label="Language"
      value={currentLocale}
      onChange={handleLocaleChange}
      className="w-40"
      aria-label="Select language"
    >
      {Object.entries(availableLocales).map(([code, name]) => (
        <SelectItem key={code}>
          {name}
        </SelectItem>
      ))}
    </Select>
  );
}

export default LanguageSelector; 