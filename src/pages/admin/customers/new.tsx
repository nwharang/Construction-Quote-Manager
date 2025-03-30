import React, { useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { api } from '~/utils/api';
import { Layout } from '~/components/Layout';
import { EntityForm, type EntityFormField } from '~/components/shared/EntityForm';
import { TextField, TextAreaField } from '~/components/shared/EntityFormFields';
import { z } from 'zod';

interface CustomerFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const NewCustomerPage: NextPage = () => {
  const router = useRouter();
  const utils = api.useContext();

  // Form state
  const [customer, setCustomer] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Form validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});

  // Create customer mutation
  const createCustomerMutation = api.customer.create.useMutation({
    onSuccess: () => {
      // Invalidate queries to refetch customer list
      utils.customer.getAll.invalidate();
      // Redirect to customer list
      router.push('/admin/customers');
    },
  });

  // Validation schema
  const validationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
  });

  // Handle form changes
  const handleChange = (field: keyof CustomerFormData, value: any) => {
    setCustomer((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when it changes
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (data: CustomerFormData) => {
    try {
      // Validate form
      const validatedData = validationSchema.parse(data);

      // Submit mutation
      await createCustomerMutation.mutateAsync({
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set validation errors
        const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof CustomerFormData;
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };

  // Form fields definition
  const fields: EntityFormField<CustomerFormData>[] = [
    {
      key: 'name',
      label: 'Customer Name',
      type: 'text',
      required: true,
      placeholder: 'Enter customer name',
      renderInput: ({ value, onChange, error }) => (
        <TextField
          value={value}
          onChange={onChange}
          placeholder="Enter customer name"
          required
          error={error}
          label="Customer Name"
        />
      ),
    },
    {
      key: 'email',
      label: 'Email Address',
      type: 'text',
      placeholder: 'Enter email address',
      renderInput: ({ value, onChange, error }) => (
        <TextField
          value={value}
          onChange={onChange}
          placeholder="Enter email address"
          error={error}
          label="Email Address"
        />
      ),
    },
    {
      key: 'phone',
      label: 'Phone Number',
      type: 'text',
      placeholder: 'Enter phone number',
      renderInput: ({ value, onChange, error }) => (
        <TextField
          value={value}
          onChange={onChange}
          placeholder="Enter phone number"
          error={error}
          label="Phone Number"
        />
      ),
    },
    {
      key: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Enter customer address',
      renderInput: ({ value, onChange, error }) => (
        <TextAreaField
          value={value}
          onChange={onChange}
          placeholder="Enter customer address"
          error={error}
          label="Address"
          rows={4}
        />
      ),
    },
  ];

  return (
    <Layout>
      <div className="p-6">
        <EntityForm
          title="Create New Customer"
          entity={customer}
          fields={fields}
          errors={errors}
          isSubmitting={createCustomerMutation.isPending}
          onSubmit={handleSubmit}
          onChange={handleChange}
          backUrl="/admin/customers"
          submitText="Create Customer"
        />
      </div>
    </Layout>
  );
};

export default NewCustomerPage;
