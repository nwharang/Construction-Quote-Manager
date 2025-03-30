import { useState } from 'react';
import { useToastStore } from '@/store/toastStore';
import { useTranslation } from '@/hooks/useTranslation';

interface DeleteItemOptions<T> {
  endpoint: string;
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useDeleteItem<T extends { id: string }>({
  endpoint,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
}: DeleteItemOptions<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToastStore();
  const { t } = useTranslation();

  const mutate = async (item: { id: string }) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${endpoint}/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.message || `HTTP error! Status: ${response.status}`
        );
      }

      // For successful responses, try to parse JSON but don't fail if there's none
      const data = await response.json().catch(() => ({}));

      // Show success toast
      success(
        successMessage || t('common.delete_success')
      );

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));

      // Show error toast
      error(
        errorMessage || errorObj.message || t('common.delete_error')
      );

      // Call onError callback if provided
      if (onError) {
        onError(errorObj);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutate,
    isLoading,
  };
} 