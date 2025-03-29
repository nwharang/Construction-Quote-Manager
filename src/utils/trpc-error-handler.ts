/**
 * Utilities for handling tRPC errors consistently across the application
 */
import { TRPCClientError } from '@trpc/client';
import type { AppRouter } from '~/server/api/root';

/**
 * Extract a user-friendly error message from a tRPC error
 */
export function formatTRPCError(error: unknown): string {
  if (error instanceof TRPCClientError) {
    // Try to get the error message from the response
    const json = error.data?.json;
    if (json?.message) {
      return json.message as string;
    }

    // Try to get the error message from the cause
    if (error.message) {
      return error.message;
    }
  }

  // Fallback for other error types
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Type guard to check if an error is a tRPC error
 */
export function isTRPCError(error: unknown): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}

/**
 * Type for a tRPC API error handler
 */
export type TRPCErrorHandler = (error: TRPCClientError<AppRouter>) => void;

/**
 * Create a standardized error handler for tRPC mutations and queries
 * @param onError Function to handle the formatted error message
 * @returns A function that can be passed to onError in tRPC hooks
 */
export function createTRPCErrorHandler(onError: (message: string) => void): TRPCErrorHandler {
  return (error: TRPCClientError<AppRouter>) => {
    const message = formatTRPCError(error);
    onError(message);
  };
} 