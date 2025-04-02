'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Select, SelectItem, SelectSection, Spinner, Input, Card, CardBody } from '@heroui/react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/useTranslation';
import { products as productsTable } from '~/server/db/schema';
import { type InferSelectModel } from 'drizzle-orm';
import { Search as SearchIcon } from 'lucide-react';

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

// Helper to create debounce function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to clear the timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Component for selecting a product from a list fetched via API.
 * Includes a search input within the dropdown and displays products as cards.
 * Implements asynchronous loading with debounced search and infinite scroll.
 */
export const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Product',
  placeholder = 'Select a product...',
}) => {
  const { t, formatCurrency } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Use the NEW getInfiniteList procedure
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading } =
    api.product.getInfiniteList.useInfiniteQuery(
      {
        limit: 20,
        search: debouncedSearchTerm,
        // cursor starts undefined implicitly
      },
      {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: !disabled,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  // Flatten the pages into a single list of products
  const allProducts = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  // Find the full selected product object based on the value (ID)
  const selectedProduct = useMemo(
    () => allProducts.find((p) => p.id === value),
    [allProducts, value]
  );

  // Handle selection change
  const handleSelectionChange = (keys: React.Key | Set<React.Key>) => {
    const selectedKey = keys instanceof Set ? Array.from(keys)[0] : keys;
    if (selectedKey) {
      const product = allProducts.find((p) => p.id === selectedKey);
      onChange(product || null);
    } else {
      onChange(null);
    }
  };

  // Re-add manual onScroll handler
  const onScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Re-add useEffect for scroll listener
  useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', onScroll);
      return () => scrollElement.removeEventListener('scroll', onScroll);
    }
  }, [onScroll, scrollContainerRef]); // Use ref in dependency array to ensure re-attachment

  // Content for the dropdown list
  const listContent = (
    <>
      {/* Search Input */}
      <div className="border-divider sticky top-0 z-10 border-b bg-white p-2 dark:bg-gray-800">
        <Input
          aria-label={t('common.search')}
          placeholder={t('common.search')} // Use existing key
          startContent={<SearchIcon size={18} className="text-default-400" />}
          value={searchTerm}
          onValueChange={setSearchTerm}
          variant="bordered"
          size="sm"
          className="w-full"
        />
      </div>

      {/* Scrollable container - Attach manual ref and handler */}
      <div
        className="max-h-[300px] overflow-y-auto"
        ref={scrollContainerRef} // Use manual ref
        onScroll={onScroll} // Use manual handler
      >
        {/* Handle Initial Loading State */}
        {isLoading && allProducts.length === 0 ? (
          <SelectItem key="loading-initial" className="text-center">
            <Spinner size="sm" />
          </SelectItem>
        ) : null}

        {/* Handle No Results State */}
        {!isLoading && allProducts.length === 0 && !isFetching ? (
          <SelectItem key="no-results" className="text-center text-gray-500">
            {t('common.noResults')}
          </SelectItem>
        ) : null}

        {/* Render Section only if there are products */}
        {allProducts.length > 0 && (
          <SelectSection showDivider={allProducts.length > 0 || isFetchingNextPage}>
            {allProducts.map((product) => (
              <SelectItem key={product.id} textValue={product.name} className="h-auto p-0">
                <Card shadow="none" className="w-full bg-transparent">
                  <CardBody className="p-2">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-small font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </span>
                        <span className="text-tiny text-default-500">
                          {product.sku ? `SKU: ${product.sku}` : t('common.noSKU')}
                        </span>
                        <span className="text-tiny text-default-500">
                          {formatCurrency(Number(product.unitPrice))}
                        </span>
                      </div>
                    </div>
                    {product.description && (
                      <p className="text-default-600 mt-1 line-clamp-2 text-xs">
                        {product.description}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </SelectItem>
            ))}
          </SelectSection>
        )}

        {/* Render loading more spinner manually */}
        {isFetchingNextPage ? (
          <SelectItem
            key="loading-more"
            className="flex h-10 items-center justify-center text-center"
          >
            <Spinner size="sm" />
          </SelectItem>
        ) : null}
      </div>
    </>
  );

  return (
    <Select
      label={label}
      placeholder={placeholder}
      selectedKeys={value ? new Set([value]) : new Set()}
      onSelectionChange={handleSelectionChange}
      isDisabled={disabled}
      isLoading={isLoading} // Still show main loading state while initial fetch happens
      aria-label={label}
      className="max-w-xs"
    >
      {/* Render a SelectItem representing the selected value when the dropdown is closed. */}
      {/* If the selected product is loaded, display its name. */}
      {/* If there's a value but the product isn't loaded (initial state), show 'Loading...'. */}
      {/* If no value, render nothing specific (Select handles placeholder). */}
      {selectedProduct ? (
        <SelectItem key={selectedProduct.id} textValue={selectedProduct.name}>
          {selectedProduct.name}
        </SelectItem>
      ) : value ? (
        <SelectItem key={value} textValue="Loading...">
          Loading...
        </SelectItem>
      ) : (
        // Render a placeholder item when no value is selected. Needed by Select.
        <SelectItem key="_placeholder" style={{ display: 'none' }} />
      )}

      {/* The actual dropdown content with search and list */}
      {listContent}
    </Select>
  );
};
