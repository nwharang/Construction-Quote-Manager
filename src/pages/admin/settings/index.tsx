import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Switch,
  Button,
  Spinner,
  Tabs,
  Tab,
} from '@heroui/react';
import { useAppToast } from '~/components/providers/ToastProvider';
import { useSettings } from '~/contexts/settings-context';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { settings, updateSettings, isLoading } = useSettings();
  const toast = useAppToast();
  
  // Create local state for form values
  const [formValues, setFormValues] = useState({...settings});
  const [isSaving, setIsSaving] = useState(false);
  
  // Update local form state when settings are loaded
  useEffect(() => {
    setFormValues({...settings});
  }, [settings]);

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

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

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences</p>
        </div>

        <Tabs aria-label="Settings tabs">
          <Tab key="general" title="General">
            <Card>
              <CardHeader>General Settings</CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="bg-info/10 p-3 rounded-md mb-3">
                    <p className="text-sm">
                      <strong>Note:</strong> All company information is completely optional. 
                      Empty fields will use default values when needed.
                    </p>
                  </div>
                
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Company Name
                    </label>
                    <Input
                      value={formValues.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Your Company Name (Optional)"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Company Email</label>
                    <Input
                      type="email"
                      value={formValues.companyEmail}
                      onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                      placeholder="company@example.com (Optional)"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Company Phone</label>
                    <Input
                      type="tel"
                      value={formValues.companyPhone}
                      onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                      placeholder="(555) 555-5555 (Optional)"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Company Address</label>
                    <Input
                      value={formValues.companyAddress}
                      onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                      placeholder="123 Main St, City, State ZIP (Optional)"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      color="primary"
                      startContent={<Save size={18} />}
                      onPress={() => handleSaveSettings('general')}
                      isLoading={isSaving}
                    >
                      Save General Settings
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="quotes" title="Quotes">
            <Card>
              <CardHeader>Quote Settings</CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Default Complexity Charge (%)</label>
                    <Input
                      type="number"
                      value={formValues.defaultComplexityCharge}
                      onChange={(e) => handleInputChange('defaultComplexityCharge', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Default Markup Charge (%)</label>
                    <Input
                      type="number"
                      value={formValues.defaultMarkupCharge}
                      onChange={(e) => handleInputChange('defaultMarkupCharge', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Default Task Price</label>
                    <Input
                      type="number"
                      value={formValues.defaultTaskPrice}
                      onChange={(e) => handleInputChange('defaultTaskPrice', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Default Material Price</label>
                    <Input
                      type="number"
                      value={formValues.defaultMaterialPrice}
                      onChange={(e) => handleInputChange('defaultMaterialPrice', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      color="primary"
                      startContent={<Save size={18} />}
                      onPress={() => handleSaveSettings('quotes')}
                      isLoading={isSaving}
                    >
                      Save Quote Settings
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="notifications" title="Notifications">
            <Card>
              <CardHeader>Notification Settings</CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Email Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important updates
                      </p>
                    </div>
                    <Switch
                      isSelected={formValues.emailNotifications}
                      onValueChange={(checked) => handleInputChange('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Quote Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when quotes are updated or status changes
                      </p>
                    </div>
                    <Switch
                      isSelected={formValues.quoteNotifications}
                      onValueChange={(checked) => handleInputChange('quoteNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Task Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about task updates and deadlines
                      </p>
                    </div>
                    <Switch
                      isSelected={formValues.taskNotifications}
                      onValueChange={(checked) => handleInputChange('taskNotifications', checked)}
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      color="primary"
                      startContent={<Save size={18} />}
                      onPress={() => handleSaveSettings('notifications')}
                      isLoading={isSaving}
                    >
                      Save Notification Settings
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="appearance" title="Appearance">
            <Card>
              <CardHeader>Appearance Settings</CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Theme</label>
                    <Select
                      selectedKeys={[formValues.theme]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as 'light' | 'dark' | 'system';
                        handleInputChange('theme', selected);
                      }}
                    >
                      <SelectItem key="light">Light</SelectItem>
                      <SelectItem key="dark">Dark</SelectItem>
                      <SelectItem key="system">System</SelectItem>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Currency</label>
                    <Input
                      value={formValues.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      placeholder="USD"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Currency Symbol</label>
                    <Input
                      value={formValues.currencySymbol}
                      onChange={(e) => handleInputChange('currencySymbol', e.target.value)}
                      placeholder="$"
                    />
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
                </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
} 