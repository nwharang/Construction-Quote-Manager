'use client';

import { useState } from 'react';
import { useAppToast } from '~/components/providers/ToastProvider';
import { 
  type EntityColumn 
} from '~/components/shared/EntityList';

export interface DeleteMutation<MutationResultType> {
  mutate: (params: { id: string }, options?: { 
    onSuccess?: () => void;
    onError?: (error: any) => void;
  }) => Promise<MutationResultType>;
  isPending: boolean;
}

export interface UseEntityListOptions<T, MutationResultType> {
  entityName: string;
  entityNamePlural: string;
  baseUrl: string;
  getAll: (params: { search: string; page: number; limit: number }) => 
    { data: { entities: T[]; totalCount: number } | undefined; isLoading: boolean; refetch: () => void };
  deleteEntity: DeleteMutation<MutationResultType>;
  columns: EntityColumn<T>[];
  pageSize?: number;
}

export function useEntityList<T extends { id: string; name: string }, MutationResultType = unknown>({
  entityName,
  entityNamePlural,
  baseUrl,
  getAll,
  deleteEntity,
  columns,
  pageSize = 10
}: UseEntityListOptions<T, MutationResultType>) {
  const toast = useAppToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Get data with search and pagination
  const { 
    data,
    isLoading,
    refetch 
  } = getAll({
    search: searchQuery,
    page,
    limit: pageSize
  });
  
  // Delete entity mutation
  const deleteEntityMutation = deleteEntity;
  
  const handleDeleteClick = (entity: T) => {
    setSelectedEntity(entity);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (selectedEntity) {
      deleteEntityMutation.mutate(
        { id: selectedEntity.id },
        {
          onSuccess: () => {
            toast.success(`${entityName} deleted successfully`);
            setIsDeleteDialogOpen(false);
            refetch();
          },
          onError: (error: any) => {
            toast.error(`Error deleting ${entityName.toLowerCase()}: ${error.message}`);
          }
        }
      );
    }
  };
  
  return {
    // State
    searchQuery,
    page,
    pageSize,
    selectedEntity,
    isDeleteDialogOpen,
    
    // Actions
    setSearchQuery,
    setPage,
    setSelectedEntity,
    setIsDeleteDialogOpen,
    handleDeleteClick,
    handleDeleteConfirm,
    
    // Data
    data: data?.entities || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    refetch,
    columns,
    
    // Derived values
    baseUrl,
    isDeleting: deleteEntityMutation.isPending,
    entityName,
    entityNamePlural
  };
} 