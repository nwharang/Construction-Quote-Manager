'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useUI } from '../providers/UIProvider';
import { useAppToast } from '../providers/ToastProvider';

// Define different types of entities in our application
export type EntityType = 'customer' | 'product' | 'quote' | 'task' | 'material';

// Define common entity options
interface EntityOptions {
  // Entity specific settings
  entityType: EntityType;
  baseUrl: string;
  
  // UI display settings
  displayNameField: string;
  icon?: React.ReactNode;
  
  // Listing features
  enableSearch?: boolean;
  enablePagination?: boolean;
  
  // Action permissions
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canView?: boolean;
  
  // Custom handlers
  onSuccessCreate?: (data: any) => void;
  onSuccessUpdate?: (data: any) => void;
  onSuccessDelete?: (id: string) => void;
  onError?: (error: Error) => void;
}

// Define context type
interface EntityContextType extends EntityOptions {
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  updateOptions: (options: Partial<EntityOptions>) => void;
}

// Create context with undefined default value
const EntityContext = createContext<EntityContextType | undefined>(undefined);

// Default options
const defaultEntityOptions: EntityOptions = {
  entityType: 'customer',
  baseUrl: '/admin/customers',
  displayNameField: 'name',
  enableSearch: true,
  enablePagination: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canView: true,
};

interface EntityProviderProps {
  children: React.ReactNode;
  options: Partial<EntityOptions>;
}

export function EntityProvider({ children, options }: EntityProviderProps) {
  const { buttonSettings } = useUI();
  const toast = useAppToast();
  
  // Merge provided options with defaults
  const [entityOptions, setEntityOptions] = useState<EntityOptions>({
    ...defaultEntityOptions,
    ...options,
  });
  
  // Update options function
  const updateOptions = (newOptions: Partial<EntityOptions>) => {
    setEntityOptions(prev => ({ ...prev, ...newOptions }));
  };
  
  // Toast handling methods
  const showSuccessToast = (message: string) => {
    toast.success(message);
  };
  
  const showErrorToast = (message: string) => {
    toast.error(message);
  };
  
  // Memoize context value
  const contextValue = useMemo(
    () => ({
      ...entityOptions,
      showSuccessToast,
      showErrorToast,
      updateOptions,
    }),
    [entityOptions]
  );
  
  return (
    <EntityContext.Provider value={contextValue}>
      {children}
    </EntityContext.Provider>
  );
}

// Hook to use entity context
export function useEntity() {
  const context = useContext(EntityContext);
  if (context === undefined) {
    throw new Error('useEntity must be used within an EntityProvider');
  }
  return context;
}

// HOC to bind a component to the entity context
export function withEntity<P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<EntityOptions>
) {
  const WithEntityComponent = (props: P) => (
    <EntityProvider options={options}>
      <Component {...props} />
    </EntityProvider>
  );
  
  const componentName = Component.displayName || Component.name || 'Component';
  WithEntityComponent.displayName = `withEntity(${componentName})`;
  
  return WithEntityComponent;
} 