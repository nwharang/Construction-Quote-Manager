import React, { useState } from 'react';
import { z } from 'zod';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
} from '@heroui/react';
import { useAppToast } from '~/components/providers/ToastProvider';
import type { RouterOutputs } from '~/utils/api';
import { FormField } from '~/components/ui/FormField';
import { KeyboardFocusWrapper } from '~/components/ui/KeyboardFocusWrapper';

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
}

export function CustomerForm({ customer, onSubmit, isLoading }: CustomerFormProps) {
  const { success, error } = useAppToast();
  const [formData, setFormData] = useState<CustomerFormData>(customer || {
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors when field is modified
    if (formErrors[name as keyof CustomerFormData]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof CustomerFormData];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const result = customerSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof CustomerFormData;
        newErrors[path] = err.message;
      });
      setFormErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onSubmit(formData);
      success(customer ? 'Customer updated successfully' : 'Customer created successfully');
    } catch (err) {
      error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-foreground" id="customer-form-title">
          {customer ? 'Edit Customer' : 'New Customer'}
        </h2>
      </CardHeader>
      <KeyboardFocusWrapper>
        <form onSubmit={handleSubmit} aria-labelledby="customer-form-title">
          <CardBody>
            <div className="flex flex-col gap-4">
              <FormField
                id="name"
                name="name"
                label="Name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                error={formErrors.name}
                isRequired={true}
                placeholder="Enter customer name"
              />

              <FormField
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                error={formErrors.email}
                placeholder="Enter customer email"
              />

              <FormField
                id="phone"
                name="phone"
                label="Phone"
                type="text"
                value={formData.phone || ''}
                onChange={handleChange}
                error={formErrors.phone}
                placeholder="Enter customer phone"
              />

              <FormField
                id="address"
                name="address"
                label="Address"
                type="text"
                value={formData.address || ''}
                onChange={handleChange}
                error={formErrors.address}
                placeholder="Enter customer address"
              />

              <FormField
                id="notes"
                name="notes"
                label="Notes"
                type="textarea"
                value={formData.notes || ''}
                onChange={handleChange}
                error={formErrors.notes}
                placeholder="Enter any additional notes"
              />
            </div>
          </CardBody>
          <CardFooter>
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              className="w-full"
            >
              {customer ? 'Update Customer' : 'Create Customer'}
            </Button>
          </CardFooter>
        </form>
      </KeyboardFocusWrapper>
    </Card>
  );
} 