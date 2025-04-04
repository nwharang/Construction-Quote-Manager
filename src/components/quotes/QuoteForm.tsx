'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  Textarea,
  Spinner,
  Divider,
  NumberInput,
} from '@heroui/react';
import { PlusCircle, Trash, X } from 'lucide-react';
import { api } from '~/utils/api';
import { type QuoteStatusType } from '~/server/db/schema';
import { QuoteStatusSettings } from './QuoteStatusBadge';

// Form field types
interface QuoteFormValues {
  title: string;
  customerId: string;
  status: QuoteStatusType;
  markupPercentage: number;
  notes: string;
  // For future implementation
  tasks: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  materials: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface QuoteFormProps {
  initialValues?: Partial<QuoteFormValues> & { id?: string };
  onSubmit: (values: QuoteFormValues) => void;
  isSubmitting: boolean;
}

export function QuoteForm({ initialValues, onSubmit, isSubmitting }: QuoteFormProps) {
  const [formValues, setFormValues] = useState<QuoteFormValues>({
    title: initialValues?.title || '',
    customerId: initialValues?.customerId || '',
    status: initialValues?.status || 'DRAFT',
    markupPercentage: initialValues?.markupPercentage || 0,
    notes: initialValues?.notes || '',
    tasks: initialValues?.tasks || [],
    materials: initialValues?.materials || [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof QuoteFormValues, string>>>({});

  // Fetch customers for dropdown
  const { data: customers, isLoading: isLoadingCustomers } = api.customer.getAll.useQuery(
    { limit: 100 },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof QuoteFormValues, string>> = {};
    
    if (!formValues.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formValues.customerId) {
      newErrors.customerId = 'Customer is required';
    }
    
    if (formValues.markupPercentage < 0 || formValues.markupPercentage > 100) {
      newErrors.markupPercentage = 'Markup must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Event handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formValues);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Quote Title
          </label>
          <Input
            id="title"
            name="title"
            value={formValues.title}
            onChange={handleChange}
            placeholder="Enter quote title"
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="customerId" className="block text-sm font-medium mb-1">
            Customer
          </label>
          {isLoadingCustomers ? (
            <Spinner size="sm" />
          ) : (
            <select
              id="customerId"
              name="customerId"
              value={formValues.customerId}
              onChange={handleChange}
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm ${errors.customerId ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Select a customer</option>
              {customers?.customers?.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          )}
          {errors.customerId && <p className="mt-1 text-sm text-red-500">{errors.customerId}</p>}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formValues.status}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {Object.entries(QuoteStatusSettings).map(([status, settings]) => (
              <option key={status} value={status}>
                {settings.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="markupPercentage" className="block text-sm font-medium mb-1">
            Markup Percentage (%)
          </label>
          <NumberInput
            id="markupPercentage"
            value={formValues.markupPercentage}
            onChange={(value) => handleNumberChange('markupPercentage', Number(value))}
            min={0}
            max={100}
            className={errors.markupPercentage ? "border-red-500" : ""}
          />
          {errors.markupPercentage && <p className="mt-1 text-sm text-red-500">{errors.markupPercentage}</p>}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes
          </label>
          <Textarea
            id="notes"
            name="notes"
            value={formValues.notes}
            onChange={handleChange}
            placeholder="Additional notes or comments"
            rows={4}
          />
        </div>

        {/* Task and Material sections can be implemented in the future */}
        <div>
          <label className="block text-sm font-medium mb-1">Tasks & Labor</label>
          <Card>
            <CardBody>
              <div className="text-center p-4 text-gray-500">
                Task management will be implemented in a future update
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Materials</label>
          <Card>
            <CardBody>
              <div className="text-center p-4 text-gray-500">
                Material management will be implemented in a future update
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Divider />

      <Button
        type="submit"
        color="primary"
        isDisabled={isSubmitting}
        className="mt-4"
        isLoading={isSubmitting}
      >
        {initialValues?.id ? 'Update Quote' : 'Create Quote'}
      </Button>
    </form>
  );
} 