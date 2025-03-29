import { useEffect } from 'react';
import { type TRPCClientErrorLike } from '@trpc/client';
import { type UseTRPCQueryResult } from '@trpc/react-query/shared';
import { useErrorHandler } from './useErrorHandler';
import { type AppRouter } from '~/server/api/root';

/**
 * Custom hook that adds error handling to a tRPC query
 * @param query The tRPC query result object
 * @param options Options for error handling
 */
export function useTrpcErrorHandling<TData, TError>(
  query: UseTRPCQueryResult<TData, TRPCClientErrorLike<AppRouter>>,
  options?: {
    fallbackMessage?: string;
    redirectTo?: string;
    logError?: boolean;
    enabled?: boolean;
  }
) {
  const { handleError } = useErrorHandler();
  const { error } = query;
  const enabled = options?.enabled !== false;

  useEffect(() => {
    if (error && enabled) {
      handleError(error, {
        fallbackMessage: options?.fallbackMessage || 'An error occurred while fetching data',
        redirectTo: options?.redirectTo,
        logError: options?.logError,
      });
    }
  }, [error, handleError, options, enabled]);

  return query;
}

/**
 * A helper hook that combines a tRPC query with error handling
 * @example
 * const query = useTrpcQueryWithErrorHandling({
 *   queryFn: () => api.quote.getAll.useQuery({ page: 1, limit: 10 }),
 *   fallbackMessage: 'Failed to load quotes'
 * });
 */
export function useTrpcQueryWithErrorHandling<TData>({
  queryResult,
  fallbackMessage,
  redirectTo,
  logError,
  enabled,
}: {
  queryResult: UseTRPCQueryResult<TData, TRPCClientErrorLike<AppRouter>>;
  fallbackMessage?: string;
  redirectTo?: string;
  logError?: boolean;
  enabled?: boolean;
}): UseTRPCQueryResult<TData, TRPCClientErrorLike<AppRouter>> {
  return useTrpcErrorHandling(queryResult, {
    fallbackMessage,
    redirectTo,
    logError,
    enabled,
  });
} 