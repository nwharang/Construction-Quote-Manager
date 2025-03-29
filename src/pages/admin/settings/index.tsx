import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Spinner, Tabs, Tab } from '@heroui/react';
import { useAppToast } from '~/components/providers/ToastProvider';
import { useSettings } from '~/contexts/settings-context';
import { useTranslation } from '~/hooks/useTranslation';

// Import the new component modules
import { GeneralSettings } from '~/components/settings/GeneralSettings';
import { QuoteSettings } from '~/components/settings/QuoteSettings';
import { NotificationSettings } from '~/components/settings/NotificationSettings';
import { AppearanceSettings } from '~/components/settings/AppearanceSettings';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { settings, updateSettings, isLoading } = useSettings();
  const toast = useAppToast();
  const { t } = useTranslation();
  
  // Create local state for form values
  const [formValues, setFormValues] = useState({...settings});
  const [isSaving, setIsSaving] = useState(false);
  
  // Update local form state when settings are loaded
  useEffect(() => {
    setFormValues({...settings});
  }, [settings]);

  // Handle unauthenticated users - using useEffect to avoid hook-after-return
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleInputChange = (
    key: keyof typeof settings,
    value: string | boolean | number
  ) => {
    // Update local form state only, not the actual settings
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSaveSettings = (section: string) => {
    setIsSaving(true);
    
    try {
      // Create a copy of the values to update
      let updatedSettings: Partial<typeof settings> = {};
      
      if (section === 'general') {
        // Company information is completely optional, no validation needed
        updatedSettings = {
          companyName: formValues.companyName,
          companyEmail: formValues.companyEmail,
          companyPhone: formValues.companyPhone,
          companyAddress: formValues.companyAddress
        };
      } else if (section === 'quotes') {
        updatedSettings = {
          defaultComplexityCharge: formValues.defaultComplexityCharge,
          defaultMarkupCharge: formValues.defaultMarkupCharge,
          defaultTaskPrice: formValues.defaultTaskPrice,
          defaultMaterialPrice: formValues.defaultMaterialPrice
        };
      } else if (section === 'notifications') {
        updatedSettings = {
          emailNotifications: formValues.emailNotifications,
          quoteNotifications: formValues.quoteNotifications,
          taskNotifications: formValues.taskNotifications
        };
      } else if (section === 'appearance') {
        updatedSettings = {
          theme: formValues.theme,
          locale: formValues.locale,
          currency: formValues.currency,
          currencySymbol: formValues.currencySymbol,
          dateFormat: formValues.dateFormat,
          timeFormat: formValues.timeFormat
        };
      }
      
      // Update the settings
      updateSettings(updatedSettings);
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  // Not authenticated - handled by useEffect above
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences</p>
        </div>

        <Tabs aria-label="Settings tabs">
          <Tab key="general" title="General">
            <GeneralSettings 
              formValues={formValues}
              handleInputChange={handleInputChange}
              handleSaveSettings={handleSaveSettings}
              isSaving={isSaving}
            />
          </Tab>

          <Tab key="quotes" title="Quotes">
            <QuoteSettings 
              formValues={formValues}
              handleInputChange={handleInputChange}
              handleSaveSettings={handleSaveSettings}
              isSaving={isSaving}
            />
          </Tab>

          <Tab key="notifications" title="Notifications">
            <NotificationSettings 
              formValues={formValues}
              handleInputChange={handleInputChange}
              handleSaveSettings={handleSaveSettings}
              isSaving={isSaving}
            />
          </Tab>

          <Tab key="appearance" title="Appearance">
            <AppearanceSettings 
              formValues={formValues}
              handleInputChange={handleInputChange}
              handleSaveSettings={handleSaveSettings}
              isSaving={isSaving}
            />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
} 