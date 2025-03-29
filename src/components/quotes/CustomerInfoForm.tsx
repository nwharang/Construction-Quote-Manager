import React from 'react';
import { Card, CardBody, CardHeader, Input, Textarea } from '@heroui/react';
import { useTranslation } from '~/hooks/useTranslation';
import type { QuoteFormData } from '~/types/quote';

interface CustomerInfoFormProps {
  formData: QuoteFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
  formData,
  handleInputChange,
}) => {
  const { t } = useTranslation();
  
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
          />
          
          <Input
            name="customerName"
            label="Customer Name"
            placeholder="Enter customer name"
            value={formData.customerName}
            onChange={handleInputChange}
            required
          />
          
          <Input
            name="customerEmail"
            label="Customer Email"
            type="email"
            placeholder="customer@example.com"
            value={formData.customerEmail}
            onChange={handleInputChange}
          />
          
          <Input
            name="customerPhone"
            label="Customer Phone"
            placeholder="(555) 555-5555"
            value={formData.customerPhone}
            onChange={handleInputChange}
          />
          
          <Textarea
            name="notes"
            label="Notes"
            placeholder="Add any additional notes about this quote"
            value={formData.notes}
            onChange={handleInputChange}
          />
        </div>
      </CardBody>
    </Card>
  );
}; 