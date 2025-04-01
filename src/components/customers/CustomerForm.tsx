'use client';

import React from 'react';
import { z } from 'zod';
import { useRouter } from 'next/router';
import type { RouterOutputs } from '~/utils/api';
import { 
  EntityForm, 
  type EntityFormField 
} from '~/components/shared/EntityForm';
import { KeyboardFocusWrapper } from '~/components/ui/KeyboardFocusWrapper';
import { 
  TextField, 
  TextAreaField 
} from '~/components/shared/EntityFormFields';
import { useEntityForm } from '~/hooks/useEntityForm';

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

type Customer = RouterOutputs['customer']['getById'];

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  isLoading?: boolean;
  backUrl?: string;
}

export function CustomerForm({ 
  customer, 
  onSubmit, 
  isLoading = false,
  backUrl = '/admin/customers' 
}: CustomerFormProps) {
  const router = useRouter();
  
  // Default values for a new customer
  const defaultValues: CustomerFormData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  };
  
  // Use our entity form hook
  const {
    formData,
    formErrors,
    isSubmitting,
    isEdit,
    handleChange,
    handleSubmit
  } = useEntityForm<CustomerFormData>({
    initialData: customer,
    defaultValues,
    schema: customerSchema,
    onSubmit,
    successMessage: {
      create: 'Customer created successfully',
      update: 'Customer updated successfully'
    }
  });

  // Define customer form fields using the EntityFormField structure
  const customerFields: EntityFormField<CustomerFormData>[] = [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter customer name',
      renderInput: (props) => (
        <TextField
          value={props.value}
          onChange={props.onChange}
          label="Name"
          placeholder="Enter customer name"
          required={props.required}
          error={props.error}
        />
      ),
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      renderInput: (props) => (
        <TextField
          value={props.value || ''}
          onChange={props.onChange}
          label="Email"
          placeholder="Enter customer email"
          error={props.error}
        />
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      type: 'text',
      renderInput: (props) => (
        <TextField
          value={props.value || ''}
          onChange={props.onChange}
          label="Phone"
          placeholder="Enter customer phone"
          error={props.error}
        />
      ),
    },
    {
      key: 'address',
      label: 'Address',
      type: 'text',
      renderInput: (props) => (
        <TextField
          value={props.value || ''}
          onChange={props.onChange}
          label="Address"
          placeholder="Enter customer address"
          error={props.error}
        />
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'textarea',
      renderInput: (props) => (
        <TextAreaField
          value={props.value || ''}
          onChange={props.onChange}
          label="Notes"
          placeholder="Enter any additional notes"
          error={props.error}
          rows={3}
        />
      ),
    },
  ];

  // Use the EntityForm component for consistent rendering
  return (
    <KeyboardFocusWrapper>
      <EntityForm
        title={isEdit ? 'Edit Customer' : 'New Customer'}
        entity={formData}
        fields={customerFields}
        errors={formErrors}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        backUrl={backUrl}
        onSubmit={handleSubmit}
        onChange={handleChange}
        submitText={isEdit ? 'Update Customer' : 'Create Customer'}
      />
    </KeyboardFocusWrapper>
  );
} 