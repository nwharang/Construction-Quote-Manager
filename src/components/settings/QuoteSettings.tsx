import React from 'react';
import { Card, CardBody, CardHeader, Input, Button } from '@heroui/react';
import { Save } from 'lucide-react';
import { useTranslation } from '~/hooks/useTranslation';
import type { Settings } from '~/types/settings';

interface QuoteSettingsProps {
  formValues: Partial<Settings>;
  handleInputChange: (key: keyof Settings, value: string | boolean | number) => void;
  handleSaveSettings: (section: string) => void;
  isSaving: boolean;
}

export const QuoteSettings: React.FC<QuoteSettingsProps> = ({
  formValues,
  handleInputChange,
  handleSaveSettings,
  isSaving,
}) => {
  const { t } = useTranslation();

  const getStringValue = (value: string | number | undefined): string => {
    if (value === undefined) return '';
    return String(value);
  };

  return (
    <Card>
      <CardHeader>Quote Settings</CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Default Complexity Charge (%)</label>
            <Input
              type="number"
              value={getStringValue(formValues.defaultComplexityCharge)}
              onChange={(e) => handleInputChange('defaultComplexityCharge', e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Default Markup Charge (%)</label>
            <Input
              type="number"
              value={getStringValue(formValues.defaultMarkupCharge)}
              onChange={(e) => handleInputChange('defaultMarkupCharge', e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Default Task Price</label>
            <Input
              type="number"
              value={getStringValue(formValues.defaultTaskPrice)}
              onChange={(e) => handleInputChange('defaultTaskPrice', e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Default Material Price</label>
            <Input
              type="number"
              value={getStringValue(formValues.defaultMaterialPrice)}
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
  );
}; 