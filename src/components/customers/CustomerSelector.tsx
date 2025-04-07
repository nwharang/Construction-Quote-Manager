import React, { useState, useCallback } from 'react';
import { api } from '~/utils/api';
import {
  Select,
  SelectItem,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
} from '@heroui/react';
import { UserPlus } from 'lucide-react';
import { useAppToast } from '~/components/providers/ToastProvider';
import { z } from 'zod';

// Type for the data returned by api.customer.getAll query items
type CustomerQueryResultItem = {
  _count: { quotes: number };
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null; // Include notes if needed for CustomerData
  createdAt: Date;
  updatedAt: Date;
};

// Type for the data passed back on change, especially for new customers
export interface CustomerData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  // notes?: string | null; // Add if needed
}

// Schema for the quick create form
const quickCreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .email({ message: 'Invalid email address' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

type QuickCreateCustomerData = z.infer<typeof quickCreateCustomerSchema>;

interface CustomerSelectorProps {
  value?: string | null;
  // Updated onChange signature
  onChange: (customerId: string | null, customerData?: CustomerData) => void;
  placeholder?: string;
  label?: string; // Add label prop consistent with HeroUI
  isInvalid?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  className?: string;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  value = null,
  onChange,
  placeholder = 'Select or create a customer',
  label = 'Customer', // Default label
  isInvalid = false,
  errorMessage,
  disabled = false,
  className,
}) => {
  const toast = useAppToast();
  const utils = api.useUtils(); // For invalidating cache
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<QuickCreateCustomerData>({
    name: '',
    email: null,
    phone: null,
    address: null,
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof QuickCreateCustomerData, string | undefined>>
  >({});

  // Fetch existing customers
  const { data, isLoading: customersLoading } = api.customer.getAll.useQuery(
    {}, // Fetch all/relevant customers for selection
    { staleTime: 5 * 60 * 1000 }
  );

  // Mutation for creating a new customer
  const createCustomerMutation = api.customer.create.useMutation({
    onSuccess: (createdCustomer) => {
      if (!createdCustomer) return;
      toast.success('Customer created successfully');
      utils.customer.getAll.invalidate(); // Invalidate query to include new customer
      setIsModalOpen(false);
      // Pass back the new customer data
      onChange(createdCustomer.id, {
        id: createdCustomer.id,
        name: createdCustomer.name,
        email: createdCustomer.email,
        phone: createdCustomer.phone,
        address: createdCustomer.address,
      });
      // Reset form
      setNewCustomer({ name: '', email: null, phone: null, address: null });
      setFormErrors({});
    },
    onError: (error) => {
      toast.error(`Error creating customer: ${error.message}`);
    },
  });

  // Handler for input changes in the modal form
  const handleInputChange = useCallback(
    (field: keyof QuickCreateCustomerData, value: string | null) => {
      setNewCustomer((prev) => ({ ...prev, [field]: value }));
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [formErrors]
  );

  // Handler for submitting the create customer form
  const handleCreateCustomer = useCallback(() => {
    const result = quickCreateCustomerSchema.safeParse(newCustomer);
    if (!result.success) {
      const errors: Partial<Record<keyof QuickCreateCustomerData, string | undefined>> = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0] as keyof QuickCreateCustomerData] = issue.message;
      });
      setFormErrors(errors);
      return;
    }
    createCustomerMutation.mutate(result.data);
  }, [newCustomer, createCustomerMutation]);

  // Handler for selecting an existing customer from the dropdown
  const handleSelectionChange = useCallback(
    (keys: 'all' | Set<React.Key>) => {
      if (keys !== 'all') {
        const selectedKey = Array.from(keys)[0] as string | undefined;
        if (selectedKey) {
          const selectedCustomerData = data?.customers.find((c) => c.id === selectedKey);
          if (selectedCustomerData) {
            onChange(selectedKey, {
              id: selectedCustomerData.id,
              name: selectedCustomerData.name,
              email: selectedCustomerData.email,
              phone: selectedCustomerData.phone,
              address: selectedCustomerData.address,
            });
          } else {
            onChange(selectedKey); // Fallback if data not found immediately
          }
        } else {
          onChange(null); // Clear selection
        }
      }
    },
    [onChange, data?.customers]
  );

  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <Select
        id="customerId"
        label={label}
        aria-label={label}
        placeholder={placeholder}
        selectedKeys={value ? [value] : []}
        onSelectionChange={handleSelectionChange}
        isDisabled={disabled || customersLoading || createCustomerMutation.isPending}
        isLoading={customersLoading}
        isInvalid={isInvalid}
        errorMessage={errorMessage}
        className="flex-1" // Take up available space
      >
        {(data?.customers ?? []).map((customer: CustomerQueryResultItem) => (
          <SelectItem key={customer.id} textValue={customer.name ?? ''}>
            <div className="flex flex-col">
              <span className="font-medium">
                {customer.name || `ID: ${customer.id.substring(0, 8)}...`}
              </span>
              {(customer.email || customer.phone) && (
                <span className="text-small text-default-500">
                  {customer.email}
                  {customer.email && customer.phone && ' • '}
                  {customer.phone}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </Select>
      <Button
        isIconOnly
        color="primary"
        variant="flat"
        onPress={() => setIsModalOpen(true)}
        aria-label="Create new customer"
        isDisabled={disabled || createCustomerMutation.isPending}
        className="mb-px" // Align button slightly better with Select
      >
        <UserPlus size={20} />
      </Button>

      {/* New Customer Modal */}
      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>Create New Customer</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="Enter customer name"
                value={newCustomer.name}
                onValueChange={(v) => handleInputChange('name', v)}
                isRequired
                errorMessage={formErrors.name}
                isInvalid={!!formErrors.name}
                autoFocus
              />
              <Input
                type="email"
                label="Email"
                placeholder="Enter customer email"
                value={newCustomer.email || ''}
                onValueChange={(v) => handleInputChange('email', v)}
                errorMessage={formErrors.email}
                isInvalid={!!formErrors.email}
              />
              <Input
                type="tel"
                label="Phone"
                placeholder="Enter customer phone"
                value={newCustomer.phone || ''}
                onValueChange={(v) => handleInputChange('phone', v)}
                errorMessage={formErrors.phone}
                isInvalid={!!formErrors.phone}
              />
              <Textarea
                label="Address"
                placeholder="Enter customer address"
                value={newCustomer.address || ''}
                onValueChange={(v) => handleInputChange('address', v)}
                errorMessage={formErrors.address}
                isInvalid={!!formErrors.address}
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
