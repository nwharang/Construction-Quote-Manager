import React from 'react';
import { Button, Input, Tabs, Tab, Tooltip, Divider } from '@heroui/react';
import { Plus, Search, LayoutGrid, LayoutList, Filter, SlidersHorizontal } from 'lucide-react';

interface ListToolbarProps {
  viewType: 'card' | 'table';
  onViewTypeChange: (type: 'card' | 'table') => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  createButtonLabel: string;
  searchPlaceholder?: string;
  hasFilter?: boolean;
  onFilterClick?: () => void;
}

/**
 * A reusable toolbar component for list pages
 * Provides view type toggle, search, filter, and action buttons
 */
export function ListToolbar({
  viewType,
  onViewTypeChange,
  searchValue,
  onSearchChange,
  onCreateClick,
  createButtonLabel,
  searchPlaceholder = 'Search...',
  hasFilter = false,
  onFilterClick,
}: ListToolbarProps) {
  return (
    <div className="bg-content1 mb-4 overflow-hidden rounded-xl shadow-sm">
      <div className="p-2 md:p-3">
        {/* Main container: stacks vertically by default, row layout on sm+ */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Group 1: Buttons (Order 1 on desktop) */}
          <div className="flex w-full items-center justify-between gap-2 sm:order-1 sm:w-auto">
            {/* Left side of buttons: View Toggle */}
            <Tabs
              selectedKey={viewType}
              size="sm"
              onSelectionChange={(key) => onViewTypeChange(key as 'card' | 'table')}
              aria-label="View Options"
              variant="solid"
              className="flex-shrink-0"
            >
              <Tab key="card" title={<LayoutGrid size={16} />} />
              <Tab key="table" title={<LayoutList size={16} />} />
            </Tabs>

            {/* Right side of buttons: Filter + Create */}
            <div className="flex flex-shrink-0 items-center gap-2">
              <Tooltip content="Filter" placement="bottom">
                <Button
                  size="sm"
                  variant="flat"
                  color="default"
                  isIconOnly
                  onPress={onFilterClick}
                  aria-label="Filter"
                  className="bg-default-50 hover:bg-default-100 h-9 w-9 min-w-9 flex-shrink-0"
                >
                  <SlidersHorizontal size={16} />
                </Button>
              </Tooltip>
              <Tooltip content={createButtonLabel} placement="bottom">
                <Button
                  size="sm"
                  color="primary"
                  isIconOnly
                  onPress={onCreateClick}
                  aria-label={createButtonLabel}
                  className="h-9 w-9 min-w-9 flex-shrink-0"
                >
                  <Plus size={16} />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Group 2: Search Input (Order 2 on desktop, grows) */}
          <div className="w-full sm:order-2 sm:w-auto sm:flex-grow">
            <Input
              size="sm"
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={onSearchChange}
              startContent={<Search size={16} className="text-default-400" />}
              className="bg-default-50 w-full min-w-[150px]" // min-width, take full width within its container
              isClearable
            />
          </div>
        </div>
      </div>
    </div>
  );
}
