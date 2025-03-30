import { useState, useCallback, useMemo } from 'react';
import type { SortDescriptor } from '@heroui/react';

interface UseSortableDataOptions<T> {
  initialSortDescriptor?: SortDescriptor | null;
  onSortChange?: (descriptor: SortDescriptor) => void;
  defaultData?: T[];
}

/**
 * A hook for managing sortable data with the HeroUI Table component
 * This can handle both local sorting and integration with remote sorting APIs
 */
export function useSortableData<T extends Record<string, any>>(
  data: T[],
  options: UseSortableDataOptions<T> = {}
) {
  const { initialSortDescriptor = null, onSortChange, defaultData = [] } = options;

  // Local state for sort descriptor
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor | null>(
    initialSortDescriptor
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (descriptor: SortDescriptor) => {
      setSortDescriptor(descriptor);
      if (onSortChange) {
        onSortChange(descriptor);
      }
    },
    [onSortChange]
  );

  // Sort data locally if no external handler is provided
  const sortedData = useMemo(() => {
    if (!sortDescriptor || !sortDescriptor.column || !sortDescriptor.direction || onSortChange) {
      return data || defaultData;
    }

    const { column, direction } = sortDescriptor;
    
    return [...(data || defaultData)].sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];
      
      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle strings
      const aString = String(aValue || '').toLowerCase();
      const bString = String(bValue || '').toLowerCase();
      
      if (direction === 'ascending') {
        return aString.localeCompare(bString);
      } else {
        return bString.localeCompare(aString);
      }
    });
  }, [data, defaultData, sortDescriptor, onSortChange]);

  return {
    sortedData,
    sortDescriptor,
    setSortDescriptor: handleSortChange,
  };
} 