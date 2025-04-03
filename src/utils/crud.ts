import type { TranslationKey } from '~/types/i18n/keys';
import { useTranslation } from '~/hooks/useTranslation';
import { useToastStore } from '~/store';

/**
 * Standard handlers for CRUD operations to ensure consistent behavior
 * across all entity types in the application
 */
export function useCrudHandlers<T>({
  createSuccessKey,
  createErrorKey,
  updateSuccessKey,
  updateErrorKey,
  deleteSuccessKey,
  deleteErrorKey,
}: {
  createSuccessKey: TranslationKey;
  createErrorKey: TranslationKey;
  updateSuccessKey: TranslationKey;
  updateErrorKey: TranslationKey;
  deleteSuccessKey: TranslationKey;
  deleteErrorKey: TranslationKey;
}) {
  const { t } = useTranslation();
  const { success, error } = useToastStore();
  
  /**
   * Generic success handler for create operations
   */
  const handleCreateSuccess = (data: T) => {
    success(t(createSuccessKey));
    return data;
  };
  
  /**
   * Generic error handler for create operations
   */
  const handleCreateError = (err: Error) => {
    error(t(createErrorKey, { message: err.message }));
    throw err;
  };
  
  /**
   * Generic success handler for update operations
   */
  const handleUpdateSuccess = (data: T) => {
    success(t(updateSuccessKey));
    return data;
  };
  
  /**
   * Generic error handler for update operations
   */
  const handleUpdateError = (err: Error) => {
    error(t(updateErrorKey, { message: err.message }));
    throw err;
  };
  
  /**
   * Generic success handler for delete operations
   */
  const handleDeleteSuccess = () => {
    success(t(deleteSuccessKey));
  };
  
  /**
   * Generic error handler for delete operations
   */
  const handleDeleteError = (err: Error) => {
    error(t(deleteErrorKey, { message: err.message }));
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