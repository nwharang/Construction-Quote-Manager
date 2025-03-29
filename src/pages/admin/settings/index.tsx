import React from 'react';
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
  Divider,
  Spinner,
  Tabs,
  Tab,
} from '@heroui/react';
import { useAppToast } from '~/components/providers/ToastProvider';
import { useSettings } from '~/contexts/settings-context';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { settings, updateSettings, isLoading } = useSettings();
  const toast = useAppToast();

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

  const handleSettingChange = (
    key: keyof typeof settings,
    value: string | boolean | number
  ) => {
    updateSettings({ [key]: value });
    toast.success('Settings updated successfully');
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
                  <div>
                    <label className="mb-2 block text-sm font-medium">Company Name</label>
                    <Input
                      value={settings.companyName}
                      onChange={(e) => handleSettingChange('companyName', e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Company Email</label>
                    <Input
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => handleSettingChange('companyEmail', e.target.value)}
                      placeholder="company@example.com"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Company Phone</label>
                    <Input
                      type="tel"
                      value={settings.companyPhone}
                      onChange={(e) => handleSettingChange('companyPhone', e.target.value)}
                      placeholder="(555) 555-5555"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Company Address</label>
                    <Input
                      value={settings.companyAddress}
                      onChange={(e) => handleSettingChange('companyAddress', e.target.value)}
                      placeholder="123 Main St, City, State ZIP"
                    />
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
                      value={settings.defaultComplexityCharge}
                      onChange={(e) => handleSettingChange('defaultComplexityCharge', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Default Markup Charge (%)</label>
                    <Input
                      type="number"
                      value={settings.defaultMarkupCharge}
                      onChange={(e) => handleSettingChange('defaultMarkupCharge', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Default Task Price</label>
                    <Input
                      type="number"
                      value={settings.defaultTaskPrice}
                      onChange={(e) => handleSettingChange('defaultTaskPrice', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Default Material Price</label>
                    <Input
                      type="number"
                      value={settings.defaultMaterialPrice}
                      onChange={(e) => handleSettingChange('defaultMaterialPrice', e.target.value)}
                      placeholder="0"
                    />
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
                      isSelected={settings.emailNotifications}
                      onValueChange={(checked) => handleSettingChange('emailNotifications', checked)}
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
                      isSelected={settings.quoteNotifications}
                      onValueChange={(checked) => handleSettingChange('quoteNotifications', checked)}
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
                      isSelected={settings.taskNotifications}
                      onValueChange={(checked) => handleSettingChange('taskNotifications', checked)}
                    />
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
                      selectedKeys={[settings.theme]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as 'light' | 'dark' | 'system';
                        handleSettingChange('theme', selected);
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
                      value={settings.currency}
                      onChange={(e) => handleSettingChange('currency', e.target.value)}
                      placeholder="USD"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Currency Symbol</label>
                    <Input
                      value={settings.currencySymbol}
                      onChange={(e) => handleSettingChange('currencySymbol', e.target.value)}
                      placeholder="$"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Date Format</label>
                    <Input
                      value={settings.dateFormat}
                      onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                      placeholder="MM/DD/YYYY"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Time Format</label>
                    <Select
                      selectedKeys={[settings.timeFormat]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as '12h' | '24h';
                        handleSettingChange('timeFormat', selected);
                      }}
                    >
                      <SelectItem key="12h">12-hour</SelectItem>
                      <SelectItem key="24h">24-hour</SelectItem>
                    </Select>
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