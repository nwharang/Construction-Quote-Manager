import React from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem, Button } from '@heroui/react';
import { Save, GlobeIcon, SunIcon, MoonIcon, LaptopIcon } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import type { Settings } from '~/types/settings';
import type { SupportedLocale } from '~/i18n/locales';

interface AppearanceSettingsProps {
  formValues: Partial<Settings>;
  handleInputChange: (key: keyof Settings, value: string | boolean | number) => void;
  handleSaveSettings: (section: string) => void;
  isSaving: boolean;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  formValues,
  handleInputChange,
  handleSaveSettings,
  isSaving,
}) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium">
          <div className="flex items-center">
            <GlobeIcon className="mr-2 h-5 w-5" />
            Display Preferences
          </div>
        </h3>
        <p className="text-sm text-muted-foreground">
          Customize how the application looks and displays information
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="space-y-2">
          <label className="mb-2 block text-sm font-medium">Theme</label>
          <Select
            aria-label="Theme"
            selectedKeys={formValues.theme ? [formValues.theme] : []}
            onChange={(e) => handleInputChange('theme', e.target.value as 'light' | 'dark' | 'system')}
          >
            <SelectItem key="light" textValue="Light Theme">
              <div className="flex items-center">
                <SunIcon className="mr-2 h-4 w-4" />
                Light
              </div>
            </SelectItem>
            <SelectItem key="dark" textValue="Dark Theme">
              <div className="flex items-center">
                <MoonIcon className="mr-2 h-4 w-4" />
                Dark
              </div>
            </SelectItem>
            <SelectItem key="system" textValue="System Theme">
              <div className="flex items-center">
                <LaptopIcon className="mr-2 h-4 w-4" />
                System
              </div>
            </SelectItem>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="mb-2 block text-sm font-medium">Language</label>
          <Select
            selectedKeys={formValues.locale ? [formValues.locale] : []}
            onChange={(e) => {
              const locale = e.target.value as SupportedLocale;
              handleInputChange('locale', locale);
            }}
            aria-label="Select language"
          >
            <SelectItem key="en" textValue="English">English</SelectItem>
            <SelectItem key="es" textValue="Español">Español</SelectItem>
            <SelectItem key="vi" textValue="Tiếng Việt">Tiếng Việt</SelectItem>
          </Select>
          <p className="text-sm text-muted-foreground">
            Changes to language settings will take effect after refreshing the page
          </p>
        </div>
        
        <div className="pt-4">
          <Button 
            color="primary"
            startContent={<Save size={18} />}
            onPress={() => handleSaveSettings('appearance')}
            isLoading={isSaving}
          >
            Save Appearance Settings
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}; 