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
  category: { id: string; name: string; /* ... other fields */ } | null;
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
  const handleSelectionChange = useCallback((keys: React.Key | Set<React.Key>) => {
    const selectedKey = keys instanceof Set ? Array.from(keys)[0] : keys;
    if (selectedKey) {
      const product = allProducts.find((p) => p.id === selectedKey); // Type P should now match
      onChange(product || null);
    } else {
      onChange(null);
    }
  }, [allProducts, onChange]);

  return (
    <Select
      label={shortLabel}
      placeholder={shortPlaceholder}
      selectedKeys={value ? new Set([value]) : new Set()}
      onSelectionChange={handleSelectionChange}
      isDisabled={disabled}
      isLoading={isLoading}
      aria-label={label}
      className="max-w-full z-[100] will-change-transform product-selector"
      classNames={{
        trigger: "h-14 text-base dark:bg-gray-800 dark:text-white",
        label: "text-base mb-1.5 dark:text-gray-300",
        listbox: "p-2 dark:bg-gray-800",
        listboxWrapper: "max-h-[50vh]", // Shorter on tiny screens
        base: "w-full"
      }}
      popoverProps={{
        classNames: {
          content: "z-[999] select-popover dark:bg-gray-800 dark:border-gray-700"
        },
        shouldBlockScroll: true,
        placement: "bottom-start", // Better alignment for small screens
        offset: 5 // Reduced offset for small screens
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {selectedProduct ? (
        <SelectItem key={selectedProduct.id} textValue={selectedProduct.name}>
          <div className="py-2 text-base">{window?.innerWidth <= 320 ? getTinyLabel(selectedProduct.name) : selectedProduct.name}</div>
        </SelectItem>
      ) : value && isLoading ? (
        <SelectItem key="loading-selected" textValue="Loading...">
          <div className="py-2 text-base">Loading...</div>
        </SelectItem>
      ) : value ? (
        <SelectItem key={value} textValue={`ID: ${value}`}>
          <div className="py-2 text-base">{`ID: ${value.substring(0, 8)}`}</div>
        </SelectItem>
      ) : (
        <SelectItem key="_placeholder" style={{ display: 'none' }} />
      )}

      {/* Direct rendering of items inside Select */}
      {isLoading && allProducts.length === 0 ? (
        <SelectItem key="loading-initial" className="text-center py-4">
          <Spinner size="md" />
        </SelectItem>
      ) : !isLoading && allProducts.length === 0 ? (
        <SelectItem key="no-results" className="text-center text-gray-500 dark:text-gray-400 py-4 text-base">
          {t('common.noResults')}
        </SelectItem>
      ) : (
        <SelectSection showDivider={allProducts.length > 0}>
          {allProducts.map((product) => (
            <SelectItem key={product.id} textValue={product.name} className="h-auto p-0">
               {/* Extra compact layout for tiny screens */}
               <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="text-base font-medium text-gray-900 dark:text-white mb-1">
                    {window?.innerWidth <= 320 ? getTinyLabel(product.name, 20) : product.name}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-default-500 dark:text-gray-400">
                      {product.sku ? `${window?.innerWidth <= 320 ? '' : 'SKU: '}${product.sku}` : ''}
                    </div>
                    <div className="text-base font-medium text-default-800 dark:text-gray-300">
                      {formatCurrency(product.unitPrice)} 
                    </div>
                  </div>
               </div>
            </SelectItem>
          ))}
        </SelectSection>
      )}
    </Select>
  );
};
