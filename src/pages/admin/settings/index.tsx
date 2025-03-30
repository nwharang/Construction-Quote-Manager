import React, { useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Tabs,
  Tab,
  Button,
  Switch,
  Input,
  Textarea,
  Select,
  SelectItem
} from '@heroui/react';
import { useSession } from 'next-auth/react';
import { MainLayout } from '~/layouts';
import { useTranslation } from '~/utils/i18n';
import { ThemeToggle } from '~/components/ThemeToggle';
import { LanguageSelector } from '~/components/LanguageSelector';
import { useConfigStore } from '~/store';
import { api } from '~/utils/api';
import { SUPPORTED_CURRENCIES } from '~/config/constants';

/**
 * Settings page component for user preferences
 */
export default function SettingsPage() {
  const { t, formatCurrency, formatDate } = useTranslation();
  const { data: session } = useSession();
  const { settings, setSettings, isLoading, setLoading, isUpdating, setUpdating } = useConfigStore();
  
  // tRPC hooks
  const settingsQuery = api.settings.get.useQuery(undefined, {
    enabled: !!session
  });
  
  // Update settings when query finishes
  useEffect(() => {
    if (settingsQuery.data) {
      // Convert string numeric values to numbers
      const formattedSettings = {
        ...settingsQuery.data,
        defaultComplexityCharge: Number(settingsQuery.data.defaultComplexityCharge || 0),
        defaultMarkupCharge: Number(settingsQuery.data.defaultMarkupCharge || 0),
        defaultTaskPrice: Number(settingsQuery.data.defaultTaskPrice || 0),
        defaultMaterialPrice: Number(settingsQuery.data.defaultMaterialPrice || 0)
      };
      setSettings(formattedSettings);
      setLoading(false);
    }
  }, [settingsQuery.data, setSettings, setLoading]);
  
  const updateSettingsMutation = api.settings.update.useMutation({
    onSuccess: (updatedSettings) => {
      // Convert string numeric values to numbers
      const formattedSettings = {
        ...updatedSettings,
        defaultComplexityCharge: Number(updatedSettings.defaultComplexityCharge || 0),
        defaultMarkupCharge: Number(updatedSettings.defaultMarkupCharge || 0),
        defaultTaskPrice: Number(updatedSettings.defaultTaskPrice || 0),
        defaultMaterialPrice: Number(updatedSettings.defaultMaterialPrice || 0)
      };
      setSettings(formattedSettings);
      setUpdating(false);
    }
  });
  
  // Example values for formatting demonstrations
  const exampleAmount = 1250.75;
  const exampleDate = new Date();
  
  // Handle form submission
  const handleSaveSettings = () => {
    setUpdating(true);
    
    // Create the settings update payload
    const updatePayload = {
      companyName: settings.companyName || 'My Construction Company',
      companyEmail: settings.companyEmail || 'info@example.com',
      companyPhone: settings.companyPhone === null ? undefined : settings.companyPhone,
      companyAddress: settings.companyAddress === null ? undefined : settings.companyAddress,
      defaultComplexityCharge: settings.defaultComplexityCharge || 0,
      defaultMarkupCharge: settings.defaultMarkupCharge || 10,
      defaultTaskPrice: settings.defaultTaskPrice || 50,
      defaultMaterialPrice: settings.defaultMaterialPrice || 100,
      emailNotifications: Boolean(settings.emailNotifications),
      quoteNotifications: Boolean(settings.quoteNotifications),
      taskNotifications: Boolean(settings.taskNotifications),
      theme: (settings.theme || 'light') as 'system' | 'light' | 'dark',
      locale: (settings.locale || 'en') as 'en' | 'vi' | 'es',
      currency: settings.currency || 'USD',
      currencySymbol: settings.currencySymbol || '$',
      dateFormat: settings.dateFormat || 'MM/DD/YYYY',
      timeFormat: (settings.timeFormat || '12h') as '12h' | '24h'
    };
    
    updateSettingsMutation.mutate(updatePayload);
  };
  
  // Handle input changes
  const handleInputChange = (field: string, value: string | number | boolean) => {
    setSettings({ [field]: value });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner" />
      </div>
    );
  }
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
        <p className="text-default-500">
          {t('app.tagline')}
        </p>
      </CardHeader>
      <Divider />
      <CardBody>
        <Tabs aria-label="Settings tabs">
          <Tab key="general" title={t('settings.general')}>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('settings.companyInfo')}</h3>
                
                <Input
                  label={t('settings.companyName')}
                  value={settings.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full"
                />
                
                <Input
                  label={t('settings.companyEmail')}
                  type="email"
                  value={settings.companyEmail || ''}
                  onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                  className="w-full"
                />
                
                <Input
                  label={t('settings.companyPhone')}
                  type="tel"
                  value={settings.companyPhone || ''}
                  onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                  className="w-full"
                />
                
                <Textarea
                  label={t('settings.companyAddress')}
                  value={settings.companyAddress || ''}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Divider />
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.language')}</h3>
                  <p className="text-default-500">{t('settings.languageDescription')}</p>
                </div>
                <LanguageSelector />
              </div>
              
              <Divider />
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.theme')}</h3>
                  <p className="text-default-500">{t('settings.themeDescription')}</p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </Tab>
          
          <Tab key="quotes" title={t('settings.quoteDefaults')}>
            <div className="space-y-6 py-4">
              <h3 className="text-lg font-medium">{t('settings.defaultValues')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label={t('settings.defaultMarkupCharge')}
                  value={String(settings.defaultMarkupCharge || 10)}
                  onChange={(e) => handleInputChange('defaultMarkupCharge', parseFloat(e.target.value))}
                  endContent="%"
                  min={0}
                  max={100}
                  step={0.5}
                />
                
                <Input
                  type="number"
                  label={t('settings.defaultComplexityCharge')}
                  value={String(settings.defaultComplexityCharge || 0)}
                  onChange={(e) => handleInputChange('defaultComplexityCharge', parseFloat(e.target.value))}
                  endContent="%"
                  min={0}
                  max={100}
                  step={0.5}
                />
                
                <Input
                  type="number"
                  label={t('settings.defaultTaskPrice')}
                  value={String(settings.defaultTaskPrice || 50)}
                  onChange={(e) => handleInputChange('defaultTaskPrice', parseFloat(e.target.value))}
                  startContent="$"
                  min={0}
                  step={0.01}
                />
                
                <Input
                  type="number"
                  label={t('settings.defaultMaterialPrice')}
                  value={String(settings.defaultMaterialPrice || 100)}
                  onChange={(e) => handleInputChange('defaultMaterialPrice', parseFloat(e.target.value))}
                  startContent="$"
                  min={0}
                  step={0.01}
                />
              </div>
            </div>
          </Tab>
          
          <Tab key="appearance" title={t('settings.appearance')}>
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.currency')}</h3>
                  <p className="text-default-500">
                    {t('settings.currencyExample')}: {formatCurrency(exampleAmount)}
                  </p>
                </div>
                <Select
                  label={t('settings.currency')}
                  selectedKeys={[settings.currency || 'USD']}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-40"
                >
                  {Object.entries(SUPPORTED_CURRENCIES).map(([code, { name }]) => (
                    <SelectItem key={code}>
                      {name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              
              <Divider />
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.dateFormat')}</h3>
                  <p className="text-default-500">
                    {t('settings.shortFormat')}: {formatDate(exampleDate, 'short')}
                    <br />
                    {t('settings.longFormat')}: {formatDate(exampleDate, 'long')}
                  </p>
                </div>
                <Select
                  label={t('settings.dateFormat')}
                  selectedKeys={[settings.dateFormat || 'MM/DD/YYYY']}
                  onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                  className="w-40"
                >
                  <SelectItem key="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem key="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem key="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </Select>
              </div>
            </div>
          </Tab>
          
          <Tab key="notifications" title={t('settings.notifications')}>
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.emailNotifications')}</h3>
                  <p className="text-default-500">{t('settings.emailNotificationsDescription')}</p>
                </div>
                <Switch
                  isSelected={Boolean(settings.emailNotifications)}
                  onValueChange={(value) => handleInputChange('emailNotifications', value)}
                  aria-label={t('settings.emailNotifications')}
                />
              </div>
              
              <Divider />
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.quoteNotifications')}</h3>
                  <p className="text-default-500">{t('settings.quoteNotificationsDescription')}</p>
                </div>
                <Switch
                  isSelected={Boolean(settings.quoteNotifications)}
                  onValueChange={(value) => handleInputChange('quoteNotifications', value)}
                  aria-label={t('settings.quoteNotifications')}
                />
              </div>
              
              <Divider />
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{t('settings.taskNotifications')}</h3>
                  <p className="text-default-500">{t('settings.taskNotificationsDescription')}</p>
                </div>
                <Switch
                  isSelected={Boolean(settings.taskNotifications)}
                  onValueChange={(value) => handleInputChange('taskNotifications', value)}
                  aria-label={t('settings.taskNotifications')}
                />
              </div>
            </div>
          </Tab>
        </Tabs>
        
        <div className="flex justify-end mt-6 gap-2">
          <Button 
            color="primary"
            isLoading={isUpdating}
            onClick={handleSaveSettings}
          >
            {t('button.save')}
          </Button>
          <Button 
            variant="light"
            onClick={() => settingsQuery.refetch()}
            isDisabled={isUpdating}
          >
            {t('button.cancel')}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

SettingsPage.getLayout = (page: React.ReactNode) => {
  return <MainLayout>{page}</MainLayout>;
}; 