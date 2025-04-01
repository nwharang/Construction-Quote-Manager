import React, { useState, useEffect } from 'react';
import { api } from '~/utils/api';
import { Select } from '@heroui/react';

interface CustomerSelectorProps {
  selectedCustomerId?: string;
  onCustomerSelect: (customerId: string) => void;
  error?: string;
  disabled?: boolean;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomerId = '',
  onCustomerSelect,
  error,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch customers
  const { data: customers, isLoading: customersLoading } = api.customer.getAll.useQuery(
    undefined,
    {
      onSettled: () => setIsLoading(false),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  useEffect(() => {
    setIsLoading(customersLoading);
  }, [customersLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCustomerSelect(e.target.value);
  };

  return (
    <div>
      <Select
        id="customerId"
        value={selectedCustomerId}
        onChange={handleChange}
        disabled={disabled || isLoading}
        className={error ? 'border-red-500' : ''}
      >
        <option value="">Select a customer</option>
        {customers?.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </Select>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
}; 