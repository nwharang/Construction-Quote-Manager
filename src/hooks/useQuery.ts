import { useState, useEffect } from 'react';
import { useToastStore } from '@/store/toastStore';

interface QueryOptions {
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Simple query hook for fetching data
 */
export function useQuery<T = any>(
  url: string,
  params: Record<string, any> = {},
  options: QueryOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { error: showErrorToast } = useToastStore();
  const { enabled = true, onSuccess, onError } = options;

  const fetchData = async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Append query parameters to URL
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      const fetchUrl = queryString ? `${url}?${queryString}` : url;

      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      setData(result as T);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      
      if (onError) {
        onError(errorObj);
      } else {
        showErrorToast(errorObj.message || 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url, JSON.stringify(params), enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
} 