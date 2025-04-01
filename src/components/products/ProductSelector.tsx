'use client';

import React, { type ReactElement } from 'react';
import { Select, SelectItem, Spinner } from '@heroui/react';
import { api, type RouterOutputs } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';

// Infer Product type from the router output
type Product = RouterOutputs['product']['getAll']['items'][number];

interface ProductSelectorProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

/**
 * Component for selecting a product from a list fetched via API.
 * Displays products in the standard format: #<sequentialId> - <name>
 */
export const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Product', // Default label
  placeholder = 'Select a product...',
}) => {
  const { t } = useTranslation();

  // Fetch product list using the correct procedure: getAll
  // Request a large limit to get all products suitable for a dropdown
  // Note: Consider infinite scroll/pagination for very large lists
  const { data, isLoading, isError, error } = api.product.getAll.useQuery(
    { limit: 1000 }, // Fetch up to 1000 products for the dropdown
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: false,
    }
  );
  
  // Use products directly from data?.items, default to empty array
  const products = data?.items ?? [];

  const handleSelectionChange = (selectedKeys: React.Key | Set<React.Key>) => {
    // HeroUI Select returns a Set for single selection mode, get the first value
    if (selectedKeys instanceof Set) {
      const firstKey = selectedKeys.values().next().value;
      onChange(firstKey ? String(firstKey) : null);
    } else {
      // Handle potential single key case if API changes
      onChange(selectedKeys ? String(selectedKeys) : null);
    }
  };

  if (isError) {
    console.error("Error fetching products:", error);
    // Render disabled select with error message
    return (
      <Select
        label={label}
        placeholder={t('common.errorLoading', { defaultValue: 'Error loading data' })}
        isDisabled={true}
        aria-label={label}
      >
        <SelectItem key="error">{t('common.errorLoading', { defaultValue: 'Error loading data' })}</SelectItem>
      </Select>
    );
  }

  return (
    <Select
      label={label}
      placeholder={placeholder}
      selectedKeys={value ? new Set([value]) : new Set()} // Manage selection state via Set
      onSelectionChange={handleSelectionChange}
      isDisabled={disabled || isLoading}
      startContent={isLoading ? <Spinner size="sm" /> : undefined}
      aria-label={label}
      items={products} // Pass products array to items prop
    >
      {/* Use function as children to render each item */} 
      {(product: Product) => (
        <SelectItem key={product.id}>
          {`#${product.sequentialId} - ${product.name}`}
        </SelectItem>
      )}
    </Select>
  );
};
