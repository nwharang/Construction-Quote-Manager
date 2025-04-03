'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Select, SelectItem, SelectSection, Spinner } from '@heroui/react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { products as productsTable } from '~/server/db/schema';
import { type InferSelectModel } from 'drizzle-orm';

// Define Product type based on Drizzle schema inference
type Product = InferSelectModel<typeof productsTable>;

// --- Props Interface --- //
interface ProductSelectorProps {
  value: string | null;
  onChange: (selectedProduct: Product | null) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

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

  // Use the items from the fetched page data
  const allProducts = productsPage?.items ?? [];

  // Find the full selected product object based on the value (ID)
  const selectedProduct = useMemo(
    () => allProducts.find((p: Product) => p.id === value),
    [allProducts, value]
  );

  // Handle selection change
  const handleSelectionChange = (keys: React.Key | Set<React.Key>) => {
    const selectedKey = keys instanceof Set ? Array.from(keys)[0] : keys;
    if (selectedKey) {
      const product = allProducts.find((p: Product) => p.id === selectedKey);
      onChange(product || null);
    } else {
      onChange(null);
    }
  };

  return (
    <Select
      label={label}
      placeholder={placeholder}
      selectedKeys={value ? new Set([value]) : new Set()}
      onSelectionChange={handleSelectionChange}
      isDisabled={disabled}
      isLoading={isLoading} // Show loading state
      aria-label={label}
      className="max-w-xs"
    >
      {/* Render a SelectItem representing the selected value when the dropdown is closed. */}
      {selectedProduct ? (
        <SelectItem key={selectedProduct.id} textValue={selectedProduct.name}>
          {selectedProduct.name}
        </SelectItem>
      ) : value && isLoading ? (
        <SelectItem key="loading-selected" textValue="Loading...">
          Loading...
        </SelectItem>
      ) : value ? (
        <SelectItem key={value} textValue={`ID: ${value}`}>
          {`ID: ${value}`}
        </SelectItem>
      ) : (
        <SelectItem key="_placeholder" style={{ display: 'none' }} />
      )}

      {/* Direct rendering of items inside Select */}
      {isLoading && allProducts.length === 0 ? (
        <SelectItem key="loading-initial" className="text-center">
          <Spinner size="sm" />
        </SelectItem>
      ) : !isLoading && allProducts.length === 0 ? (
        <SelectItem key="no-results" className="text-center text-gray-500">
          {t('common.noResults')}
        </SelectItem>
      ) : (
        <SelectSection showDivider={allProducts.length > 0}>
          {allProducts.map((product: Product) => (
            <SelectItem key={product.id} textValue={product.name} className="h-auto p-0">
               {/* Simple display for now - Card removed for simplicity */}
               <div className="p-2">
                  <div className="text-small font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </div>
                  <div className="text-tiny text-default-500">
                    {product.sku ? `SKU: ${product.sku}` : t('common.noSKU')}
                  </div>
                  <div className="text-tiny text-default-500">
                    {formatCurrency(Number(product.unitPrice))}
                  </div>
               </div>
            </SelectItem>
          ))}
        </SelectSection>
      )}
    </Select>
  );
};
