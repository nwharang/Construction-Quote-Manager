import { useTranslation } from '~/hooks/useTranslation';
import { useToastStore } from '~/store';

/**
 * Standard handlers for CRUD operations to ensure consistent behavior
 * across all entity types in the application
 */
export function useCrudHandlers<T>(entityType: string) {
  const { t } = useTranslation();
  const { success, error } = useToastStore();
  
  /**
   * Generic success handler for create operations
   */
  const handleCreateSuccess = (data: T) => {
    success(t(`${entityType}.createSuccess`));
    return data;
  };
  
  /**
   * Generic error handler for create operations
   */
  const handleCreateError = (err: Error) => {
    error(t(`${entityType}.createError`, { message: err.message }));
    throw err;
  };
  
  /**
   * Generic success handler for update operations
   */
  const handleUpdateSuccess = (data: T) => {
    success(t(`${entityType}.updateSuccess`));
    return data;
  };
  
  /**
   * Generic error handler for update operations
   */
  const handleUpdateError = (err: Error) => {
    error(t(`${entityType}.updateError`, { message: err.message }));
    throw err;
  };
  
  /**
   * Generic success handler for delete operations
   */
  const handleDeleteSuccess = () => {
    success(t(`${entityType}.deleteSuccess`));
  };
  
  /**
   * Generic error handler for delete operations
   */
  const handleDeleteError = (err: Error) => {
    error(t(`${entityType}.deleteError`, { message: err.message }));
    throw err;
  };
  
  return {
    handleCreateSuccess,
    handleCreateError,
    handleUpdateSuccess,
    handleUpdateError,
    handleDeleteSuccess,
    handleDeleteError,
  };
}

export default useCrudHandlers; 