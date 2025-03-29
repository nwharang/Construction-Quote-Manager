import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Input,
  Textarea,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
} from '@heroui/react';
import { useAppToast } from '~/components/providers/ToastProvider';
import type { RouterOutputs } from '~/utils/api';

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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    },
  });

  const handleFormSubmit = async (data: CustomerFormData) => {
    try {
      await onSubmit(data);
      success(customer ? 'Customer updated successfully' : 'Customer created successfully');
    } catch (err) {
      error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-foreground">
          {customer ? 'Edit Customer' : 'New Customer'}
        </h2>
      </CardHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              label="Name"
              placeholder="Enter customer name"
              {...register('name')}
              errorMessage={errors.name?.message}
              isInvalid={!!errors.name}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter customer email"
              {...register('email')}
              errorMessage={errors.email?.message}
              isInvalid={!!errors.email}
            />

            <Input
              label="Phone"
              placeholder="Enter customer phone"
              {...register('phone')}
              errorMessage={errors.phone?.message}
              isInvalid={!!errors.phone}
            />

            <Input
              label="Address"
              placeholder="Enter customer address"
              {...register('address')}
              errorMessage={errors.address?.message}
              isInvalid={!!errors.address}
            />

            <Textarea
              label="Notes"
              placeholder="Enter any additional notes"
              {...register('notes')}
              errorMessage={errors.notes?.message}
              isInvalid={!!errors.notes}
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
    </Card>
  );
} 