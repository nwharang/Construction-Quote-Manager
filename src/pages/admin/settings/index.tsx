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
import { toast } from 'sonner';
import { useSettings } from '~/contexts/settings-context';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { settings, updateSettings, isLoading } = useSettings();

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground/90">Settings</h1>
          <p className="text-muted-foreground/80">Manage your application settings</p>
        </div>

        <Tabs aria-label="Settings sections">
          {/* Theme Settings */}
          <Tab key="theme" title="Theme">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">Theme Settings</h2>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4">
                <Select
                  label="Theme"
                  selectedKeys={[settings.theme]}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                >
                  <SelectItem key="light">Light</SelectItem>
                  <SelectItem key="dark">Dark</SelectItem>
                  <SelectItem key="system">System</SelectItem>
                </Select>
              </CardBody>
            </Card>
          </Tab>

          {/* Quote Settings */}
          <Tab key="quotes" title="Quotes">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">Quote Settings</h2>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4">
                <Input
                  type="number"
                  label="Default Complexity Charge"
                  value={settings.defaultComplexityCharge}
                  onChange={(e) => handleSettingChange('defaultComplexityCharge', e.target.value)}
                />
                <Input
                  type="number"
                  label="Default Markup Charge"
                  value={settings.defaultMarkupCharge}
                  onChange={(e) => handleSettingChange('defaultMarkupCharge', e.target.value)}
                />
                <Input
                  type="number"
                  label="Default Task Price"
                  value={settings.defaultTaskPrice}
                  onChange={(e) => handleSettingChange('defaultTaskPrice', e.target.value)}
                />
                <Input
                  type="number"
                  label="Default Material Price"
                  value={settings.defaultMaterialPrice}
                  onChange={(e) => handleSettingChange('defaultMaterialPrice', e.target.value)}
                />
              </CardBody>
            </Card>
          </Tab>

          {/* Company Settings */}
          <Tab key="company" title="Company">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">Company Settings</h2>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4">
                <Input
                  label="Company Name"
                  value={settings.companyName}
                  onChange={(e) => handleSettingChange('companyName', e.target.value)}
                />
                <Input
                  type="email"
                  label="Company Email"
                  value={settings.companyEmail}
                  onChange={(e) => handleSettingChange('companyEmail', e.target.value)}
                />
                <Input
                  type="tel"
                  label="Company Phone"
                  value={settings.companyPhone}
                  onChange={(e) => handleSettingChange('companyPhone', e.target.value)}
                />
                <Input
                  label="Company Address"
                  value={settings.companyAddress}
                  onChange={(e) => handleSettingChange('companyAddress', e.target.value)}
                />
              </CardBody>
            </Card>
          </Tab>

          {/* Notification Settings */}
          <Tab key="notifications" title="Notifications">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">Notification Settings</h2>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Email Notifications</span>
                  <Switch
                    isSelected={settings.emailNotifications}
                    onValueChange={(value) => handleSettingChange('emailNotifications', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Quote Notifications</span>
                  <Switch
                    isSelected={settings.quoteNotifications}
                    onValueChange={(value) => handleSettingChange('quoteNotifications', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Task Notifications</span>
                  <Switch
                    isSelected={settings.taskNotifications}
                    onValueChange={(value) => handleSettingChange('taskNotifications', value)}
                  />
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* Format Settings */}
          <Tab key="format" title="Format">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">Format Settings</h2>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4">
                <Select
                  label="Currency"
                  selectedKeys={[settings.currency]}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                >
                  <SelectItem key="USD">USD ($)</SelectItem>
                  <SelectItem key="EUR">EUR (€)</SelectItem>
                  <SelectItem key="GBP">GBP (£)</SelectItem>
                </Select>
                <Select
                  label="Date Format"
                  selectedKeys={[settings.dateFormat]}
                  onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                >
                  <SelectItem key="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem key="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem key="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </Select>
                <Select
                  label="Time Format"
                  selectedKeys={[settings.timeFormat]}
                  onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                >
                  <SelectItem key="12h">12-hour</SelectItem>
                  <SelectItem key="24h">24-hour</SelectItem>
                </Select>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
} 