import { useCallback } from 'react';
import { showErrorToast, handleClientError, getErrorMessage, ErrorType } from '../utils/error-handler';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

/**
 * Custom hook for handling errors in components
 * @returns An object with error handling functions
 */
export function useErrorHandler() {
  const router = useRouter();
  const { status } = useSession();

  /**
   * Handle errors from API calls
   * @param error The error to handle
   * @param options Options for handling the error
   */
  const handleError = useCallback((
    error: unknown, 
    options?: { 
      fallbackMessage?: string; 
      redirectTo?: string;
      logError?: boolean;
    }
  ) => {
    const { type } = handleClientError(error, options?.fallbackMessage);
    
    // Show toast notification
    showErrorToast(error, options?.fallbackMessage);
    
    // Log error to console in development
    if (options?.logError !== false) {
      console.error('Error caught by useErrorHandler:', error);
    }
    
    // Handle authentication errors
    if (type === ErrorType.AUTH && status !== 'loading') {
      // Redirect to login page
      router.push('/auth/signin');
      return;
    }
    
    // Handle navigation if specified
    if (options?.redirectTo) {
      router.push(options.redirectTo);
    }
  }, [router, status]);

  /**
   * Try to execute a function and handle any errors
   * @param fn The function to execute
   * @param errorOptions Options for handling errors
   */
  const tryWithErrorHandling = useCallback(async <T>(
    fn: () => Promise<T>,
    errorOptions?: { 
      fallbackMessage?: string; 
      redirectTo?: string;
      logError?: boolean;
    }
  ): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (error) {
      handleError(error, errorOptions);
      return undefined;
    }
  }, [handleError]);

  return {
    handleError,
    tryWithErrorHandling,
    getErrorMessage,
  };
} 