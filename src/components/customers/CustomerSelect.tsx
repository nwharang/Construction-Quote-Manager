'use client';

import React, { useState } from 'react';
import {
  Select,
  SelectItem,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { UserPlus } from 'lucide-react';
import { api } from '~/utils/api';
import { useAppToast } from '~/components/providers/ToastProvider';
import { TextField, TextAreaField } from '~/components/shared/EntityFormFields';
import { customerSchema } from './CustomerForm';
import { z } from 'zod';

// Create a simpler schema for the quick create form
const quickCreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

type QuickCreateCustomerData = z.infer<typeof quickCreateCustomerSchema>;

export interface CustomerData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface CustomerSelectProps {
  value: string | null;
  onChange: (customerId: string | null, customerData?: CustomerData) => void;
  className?: string;
  label?: string;
  placeholder?: string;
  isDisabled?: boolean;
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({
  value,
  onChange,
  className = '',
  label = 'Customer',
  placeholder = 'Select a customer',
  isDisabled = false,
}) => {
  const toast = useAppToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<QuickCreateCustomerData>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof QuickCreateCustomerData, string>>>({});

  // Fetch customers with search
  const { data: customersData, isLoading } = api.customer.getAll.useQuery(
    {
      limit: 50,
      search: searchQuery,
    },
    {
      enabled: true,
    }
  );

  // Create customer mutation
  const createCustomerMutation = api.customer.create.useMutation({
    onSuccess: (customer) => {
      if (!customer) return;

      toast.success('Customer created successfully');
      setIsModalOpen(false);
      onChange(customer.id, {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      });
      // Reset form
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
      });
      setFormErrors({});
    },
    onError: (error) => {
      toast.error(`Error creating customer: ${error.message}`);
    },
  });

  // Handle input change for new customer form
  const handleInputChange = (field: keyof QuickCreateCustomerData, value: string) => {
    setNewCustomer((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear errors when field is modified
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate the form before submission
  const validateForm = (): boolean => {
    const result = quickCreateCustomerSchema.safeParse(newCustomer);
    if (!result.success) {
      const newErrors: Partial<Record<keyof QuickCreateCustomerData, string>> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof QuickCreateCustomerData;
        newErrors[path] = err.message;
      });
      setFormErrors(newErrors);
      return false;
    }
    return true;
  };

  // Handle creating a new customer
  const handleCreateCustomer = () => {
    if (!validateForm()) return;

    createCustomerMutation.mutate({
      name: newCustomer.name,
      email: newCustomer.email || null,
      phone: newCustomer.phone || null,
      address: newCustomer.address || null,
    });
  };

  // Handle selecting a customer from dropdown
  const handleSelectCustomer = (id: string) => {
    const selectedCustomer = customersData?.customers.find((c) => c.id === id);
    if (selectedCustomer) {
      onChange(id, {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        address: selectedCustomer.address,
      });
    } else {
      onChange(id);
    }
  };

  // Create a formatted list of customers for the dropdown
  const formattedCustomers =
    customersData?.customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    })) || [];

  return (
    <div className={className}>
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            label={label}
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => handleSelectCustomer(e.target.value)}
            className="w-full"
            isLoading={isLoading}
            isDisabled={isDisabled}
          >
            {formattedCustomers.map((customer) => (
              <SelectItem key={customer.id} textValue={customer.name}>
                <div className="flex flex-col">
                  <span className="font-medium">{customer.name}</span>
                  <span className="text-small text-default-500">
                    {customer.email && `${customer.email} • `}
                    {customer.phone && `${customer.phone}`}
                  </span>
                </div>
              </SelectItem>
            ))}
          </Select>
        </div>
        <div>
          <Button 
            isIconOnly 
            color="primary" 
            variant="ghost" 
            onPress={() => setIsModalOpen(true)}
            aria-label="Create new customer"
            isDisabled={isDisabled}
          >
            <UserPlus size={20} />
          </Button>
        </div>
      </div>

      {/* New Customer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Create New Customer</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <TextField
                label="Name"
                placeholder="Enter customer name"
                value={newCustomer.name}
                onChange={(value) => handleInputChange('name', value)}
                required
                error={formErrors.name}
              />
              <TextField
                label="Email"
                placeholder="Enter customer email"
                value={newCustomer.email || ''}
                onChange={(value) => handleInputChange('email', value)}
                error={formErrors.email}
              />
              <TextField
                label="Phone"
                placeholder="Enter customer phone"
                value={newCustomer.phone || ''}
                onChange={(value) => handleInputChange('phone', value)}
                error={formErrors.phone}
              />
              <TextAreaField
                label="Address"
                placeholder="Enter customer address"
                value={newCustomer.address || ''}
                onChange={(value) => handleInputChange('address', value)}
                error={formErrors.address}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" color="danger" onPress={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCreateCustomer}
              isLoading={createCustomerMutation.isPending}
            >
              Create Customer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
