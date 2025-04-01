'use client';

import React, { useEffect } from 'react';
import { Select, Textarea } from '@heroui/react';
import { EntityModal } from '~/components/shared/EntityModal';
import { useQuoteForm } from '~/hooks/useQuoteForm';
import { useQuoteStore } from '~/store/quoteStore';
import { CustomerSelector } from '~/components/customers/CustomerSelector';
import { TaskList } from '~/components/quotes/TaskList';
import { QuoteSummary } from '~/components/quotes/QuoteSummary';
import { QuoteStatusSelector } from '~/components/quotes/QuoteStatusSelector';
import { FormField } from '~/components/ui/FormField';
import { type RouterOutputs } from '~/utils/api';

type Quote = RouterOutputs['quote']['getById'];

interface QuoteFormModalProps {
  quote?: Quote;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export const QuoteFormModal: React.FC<QuoteFormModalProps> = ({
  quote,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const store = useQuoteStore();
  const { formData, resetForm, setFormData } = store;
  const { calculateQuoteTotals } = useQuoteForm();
  const isEditMode = !!quote;

  // Initialize form data when modal opens or quote changes
  useEffect(() => {
    if (isOpen) {
      if (quote) {
        setFormData({
          id: quote.id,
          title: quote.title || '',
          description: quote.description || '',
          customerId: quote.customerId || '',
          status: quote.status || 'DRAFT',
          validUntil: quote.validUntil ? new Date(quote.validUntil) : undefined,
          quoteNumber: quote.quoteNumber || '',
          tasks: quote.tasks || [],
          complexityPercentage: quote.complexityPercentage || 0,
          markupPercentage: quote.markupPercentage || 0,
          taxPercentage: quote.taxPercentage || 0,
          notes: quote.notes || ''
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, quote, resetForm, setFormData]);

  const handleModalSubmit = async () => {
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting quote:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    store.updateField(name as any, value);
  };

  const summaryData = calculateQuoteTotals(formData);

  return (
    <EntityModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Quote' : 'Create Quote'}
      isSubmitting={isLoading}
      onSubmit={handleModalSubmit}
      submitText={isEditMode ? 'Update Quote' : 'Create Quote'}
      size="xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            id="title"
            name="title"
            label="Title"
            value={formData.title || ''}
            onChange={handleInputChange}
            placeholder="Quote Title"
            error={store.error && !formData.title ? 'Title is required' : undefined}
          />

          <FormField
            id="quoteNumber"
            name="quoteNumber"
            label="Quote Number"
            value={formData.quoteNumber || ''}
            onChange={handleInputChange}
            placeholder="Quote #"
            error={undefined}
          />
        </div>

        <FormField
          id="description"
          name="description"
          label="Description"
          type="textarea"
          value={formData.description || ''}
          onChange={handleInputChange}
          placeholder="Detailed description of the quote"
        />

        <div className="form-group">
          <label htmlFor="customerId" className="block text-sm font-medium mb-1.5">
            Customer
          </label>
          <CustomerSelector
            selectedCustomerId={formData.customerId}
            onCustomerSelect={(customerId) => {
              store.updateField('customerId', customerId);
            }}
            error={store.error && !formData.customerId ? 'Customer is required' : undefined}
          />
        </div>

        {isEditMode && (
          <div className="form-group">
            <label htmlFor="status" className="block text-sm font-medium mb-1.5">
              Status
            </label>
            <QuoteStatusSelector
              selectedStatus={formData.status}
              onStatusSelect={(status) => {
                store.updateField('status', status);
              }}
              error={undefined}
            />
          </div>
        )}

        <FormField
          id="validUntil"
          name="validUntil"
          label="Valid Until"
          type="date"
          value={formData.validUntil ? new Date(formData.validUntil).toISOString().split('T')[0] : ''}
          onChange={handleInputChange}
        />

        <TaskList />

        <QuoteSummary />

        <FormField
          id="notes"
          name="notes"
          label="Notes"
          type="textarea"
          value={formData.notes || ''}
          onChange={handleInputChange}
          placeholder="Additional notes or terms"
        />
      </div>
    </EntityModal>
  );
}; 