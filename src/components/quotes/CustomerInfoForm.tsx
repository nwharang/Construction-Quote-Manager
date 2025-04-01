import React from 'react';
import { Card, CardBody, CardHeader, Input, Textarea } from '@heroui/react';
import { useTranslation } from '~/hooks/useTranslation';
import { useQuoteStore } from '~/store/quoteStore';

interface CustomerInfoFormProps {
  readOnly?: boolean;
}

export const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({ readOnly = false }) => {
  const { t } = useTranslation();
  const { formData, updateField } = useQuoteStore();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateField(e.target.name as keyof QuoteFormData, e.target.value);
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="text-xl font-semibold">Quote Information</h2>
      </CardHeader>
      
      <CardBody>
        <div className="grid grid-cols-1 gap-4">
          <Input
            name="title"
            label="Quote Title"
            placeholder="Enter a descriptive title for this quote"
            value={formData.title}
            onChange={handleInputChange}
            required
            isReadOnly={readOnly}
            isDisabled={readOnly}
          />
          
          <Input
            name="customerId"
            label="Customer ID"
            placeholder="Enter customer ID"
            value={formData.customerId}
            onChange={handleInputChange}
            required
            isReadOnly={readOnly}
            isDisabled={readOnly}
          />
          
          <Textarea
            name="notes"
            label="Notes"
            placeholder="Add any additional notes about this quote"
            value={formData.notes || ''}
            onChange={handleInputChange}
            isReadOnly={readOnly}
            isDisabled={readOnly}
          />
        </div>
      </CardBody>
    </Card>
  );
}; 