'use client';

import React, { useEffect, useState } from 'react';
import type { RouterOutputs } from '~/utils/api';
import { EntityModal } from '~/components/shared/EntityModal';
import { FormField } from '~/components/ui/FormField';
import { z } from 'zod';

// Define the validation schema
export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Define our form data type to match the schema
export type CustomerFormData = z.infer<typeof customerSchema>;

// Make the Customer type more flexible to support different structures returned by the API
type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Other fields may exist but are not needed for the form
  [key: string]: any;
};

// Use this type for the form state
type CustomerFormState = Partial<CustomerFormData> & {
  id?: string;
};

interface CustomerFormModalProps {
  customer?: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  isLoading?: boolean;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  customer,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CustomerFormState>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens or customer changes
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          notes: customer.notes
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, customer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModalSubmit = async () => {
    if (validateForm()) {
      try {
        // Extract only the fields needed for the form submission
        const { id, ...formDataWithoutId } = formData;
        await onSubmit(formDataWithoutId as CustomerFormData);
        onClose();
      } catch (error) {
        console.error('Error submitting customer:', error);
      }
    }
  };

  const isEditMode = !!customer?.id;

  return (
    <EntityModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Customer' : 'Create Customer'}
      isSubmitting={isLoading}
      onSubmit={handleModalSubmit}
      submitText={isEditMode ? 'Update Customer' : 'Create Customer'}
    >
      <div className="space-y-6">
        <FormField
          id="name"
          name="name"
          label="Name"
          value={formData.name || ''}
          onChange={handleInputChange}
          placeholder="Customer Name"
          error={errors.name}
          isRequired
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            id="email"
            name="email"
            label="Email"
            type="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            placeholder="Email Address"
            error={errors.email}
          />

          <FormField
            id="phone"
            name="phone"
            label="Phone"
            value={formData.phone || ''}
            onChange={handleInputChange}
            placeholder="Phone Number"
          />
        </div>

        <FormField
          id="address"
          name="address"
          label="Address"
          value={formData.address || ''}
          onChange={handleInputChange}
          placeholder="Customer Address"
        />

        <FormField
          id="notes"
          name="notes"
          label="Notes"
          type="textarea"
          value={formData.notes || ''}
          onChange={handleInputChange}
          placeholder="Additional notes about the customer"
        />
      </div>
    </EntityModal>
  );
}; 