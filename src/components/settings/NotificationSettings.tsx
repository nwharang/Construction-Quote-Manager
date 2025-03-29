import React from 'react';
import { Card, CardBody, CardHeader, Switch, Button } from '@heroui/react';
import { Save } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import type { Settings } from '~/types/settings';

interface NotificationSettingsProps {
  formValues: Partial<Settings>;
  handleInputChange: (key: keyof Settings, value: string | boolean | number) => void;
  handleSaveSettings: (section: string) => void;
  isSaving: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  formValues,
  handleInputChange,
  handleSaveSettings,
  isSaving,
}) => {
  const { t } = useTranslation();

  return (
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
              isSelected={!!formValues.emailNotifications}
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
              isSelected={!!formValues.quoteNotifications}
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
              isSelected={!!formValues.taskNotifications}
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
  );
}; 