import React from 'react';
import { Card, CardBody, CardHeader, Input, Button } from '@heroui/react';
import { Save } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import type { Settings } from '~/types/settings';

interface GeneralSettingsProps {
  formValues: Partial<Settings>;
  handleInputChange: (key: keyof Settings, value: string | boolean | number) => void;
  handleSaveSettings: (section: string) => void;
  isSaving: boolean;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  formValues,
  handleInputChange,
  handleSaveSettings,
  isSaving,
}) => {
  const { t } = useTranslation();

  return (
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
              value={formValues.companyName || ''}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="Your Company Name (Optional)"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Company Email</label>
            <Input
              type="email"
              value={formValues.companyEmail || ''}
              onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              placeholder="company@example.com (Optional)"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Company Phone</label>
            <Input
              type="tel"
              value={formValues.companyPhone || ''}
              onChange={(e) => handleInputChange('companyPhone', e.target.value)}
              placeholder="(555) 555-5555 (Optional)"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Company Address</label>
            <Input
              value={formValues.companyAddress || ''}
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
  );
}; 