import { Card, CardBody, CardHeader, Input, DatePicker } from '@heroui/react';
import { useQuoteStore } from '~/store/quoteStore';
import type { DateValue } from '@internationalized/date';
import type { QuoteFormData } from '~/types/quote';

export function QuoteHeader() {
  const { formData, updateField } = useQuoteStore();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('title', e.target.value);
  };

  const handleCustomerIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('customerId', e.target.value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('notes', e.target.value);
  };

  const handleDateChange = (date: DateValue | null) => {
    updateField('validityDate', date);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Quote Information</h2>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <Input label="Project Title" value={formData.title} onChange={handleTitleChange} />
          <Input
            label="Customer ID"
            value={formData.customerId}
            onChange={handleCustomerIdChange}
          />
          <DatePicker
            label="Valid Until"
            value={formData.validityDate}
            onChange={handleDateChange}
          />
          <Input label="Notes" value={formData.notes || ''} onChange={handleNotesChange} />
        </div>
      </CardBody>
    </Card>
  );
}
