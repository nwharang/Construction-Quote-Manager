'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Select, SelectItem, SelectSection, Spinner } from '@heroui/react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { products as productsTable } from '~/server/db/schema';
import { type InferSelectModel } from 'drizzle-orm';

// Define Product type based on Drizzle schema inference
type ProductSchemaType = InferSelectModel<typeof productsTable>;

// Adjust type for component usage: unitPrice is returned as number by the service
type Product = Omit<ProductSchemaType, 'unitPrice'> & {
  unitPrice: number;
  // Include nested category object if needed based on service return type
  category: { id: string; name: string /* ... other fields */ } | null;
};

// --- Props Interface --- //
interface ProductSelectorProps {
  value: string | null;
  onChange: (selectedProduct: Product | null) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

// Add a helper function to shorten labels for tiny screens
const getTinyLabel = (text: string, maxLength = 15) => {
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
};

/**
 * Component for selecting a product from a list fetched via API.
 * Includes asynchronous loading.
 * NOTE: Custom search and infinite scroll temporarily removed to fix runtime error.
 */
export const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Product',
  placeholder = 'Select a product...',
}) => {
  const { t, formatCurrency } = useTranslation();

  // Shorten labels for small screens
  const shortLabel = window?.innerWidth <= 320 ? 'Product' : label;
  const shortPlaceholder = window?.innerWidth <= 320 ? 'Select...' : placeholder;

  // Use the getAll procedure
  const { data: productsPage, isLoading } = api.product.getAll.useQuery(
    {
      // Omitting page/limit fetches first page with default limit (or all if pagination not fully implemented on backend yet)
      // Add search: '' if needed, but getAll might fetch all without it
    },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: !disabled,
    }
  );

  // Use the data property from the fetched page data
  const allProducts = productsPage?.data ?? [];

  // Find the full selected product object based on the value (ID)
  const selectedProduct = useMemo(
    () => allProducts.find((p) => p.id === value), // Type P should now match allProducts item type
    [allProducts, value]
  );

  // Handle selection change
  const handleSelectionChange = useCallback(
    (keys: React.Key | Set<React.Key>) => {
      const selectedKey = keys instanceof Set ? Array.from(keys)[0] : keys;
      if (selectedKey) {
        const product = allProducts.find((p) => p.id === selectedKey); // Type P should now match
        onChange(product || null);
      } else {
        onChange(null);
      }
    },
    [allProducts, onChange]
  );

  return (
    <Select
      label={shortLabel}
      labelPlacement="outside"
      placeholder={shortPlaceholder}
      selectedKeys={value ? new Set([value]) : new Set()}
      onSelectionChange={handleSelectionChange}
      isDisabled={disabled}
      isLoading={isLoading}
      aria-label={label}
      className="product-selector z-[100] max-w-full will-change-transform"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {selectedProduct ? (
        <SelectItem key={selectedProduct.id} textValue={selectedProduct.name}>
          <div className="py-2 text-base">
            {window?.innerWidth <= 320 ? getTinyLabel(selectedProduct.name) : selectedProduct.name}
          </div>
        </SelectItem>
      ) : value && isLoading ? (
        <SelectItem key="loading-selected" textValue="Loading...">
          <div className="py-2 text-base">Loading...</div>
        </SelectItem>
      ) : value ? (
        <SelectItem key={value} textValue={`ID: ${value}`}>
          <div className="py-2 text-base">{`ID: ${value.substring(0, 8)}`}</div>
        </SelectItem>
      ) : null
      }

      {/* Direct rendering of items inside Select */}
      {isLoading && allProducts.length === 0 ? (
        <SelectItem key="loading-initial" className="py-4 text-center">
          <Spinner size="md" />
        </SelectItem>
      ) : !isLoading && allProducts.length === 0 ? (
        <SelectItem
          key="no-results"
          className="py-4 text-center text-base text-gray-500 dark:text-gray-400"
        >
          {t('common.noResults')}
        </SelectItem>
      ) : (
        <SelectSection showDivider={allProducts.length > 0}>
          {allProducts.map((product) => (
            <SelectItem key={product.id} textValue={product.name} className="h-auto p-0">
              {/* Compact layout for product item */}
              <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </span>
                  <span className="ml-2 flex-shrink-0 text-sm font-medium text-gray-800 dark:text-gray-300">
                    {formatCurrency(product.unitPrice)}
                  </span>
                </div>
                {product.sku && (
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    SKU: {product.sku}
                  </div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectSection>
      )}
    </Select>
  );
};
