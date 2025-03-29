import { TRPCClientError } from '@trpc/client';
import { addToast } from '@heroui/toast';
import type { AppRouter } from '~/server/api/root';

/**
 * Error types that can be handled by the client-side error handler
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Maps TRPC error codes to our application's error types
 */
const errorTypeMap: Record<string, ErrorType> = {
  UNAUTHORIZED: ErrorType.AUTH,
  FORBIDDEN: ErrorType.AUTH,
  NOT_FOUND: ErrorType.NOT_FOUND,
  PARSE_ERROR: ErrorType.VALIDATION,
  BAD_REQUEST: ErrorType.VALIDATION,
  INTERNAL_SERVER_ERROR: ErrorType.SERVER,
  TIMEOUT: ErrorType.NETWORK,
  CONFLICT: ErrorType.VALIDATION,
  PRECONDITION_FAILED: ErrorType.VALIDATION,
  PAYLOAD_TOO_LARGE: ErrorType.VALIDATION,
  METHOD_NOT_SUPPORTED: ErrorType.SERVER,
  TOO_MANY_REQUESTS: ErrorType.SERVER,
  CLIENT_CLOSED_REQUEST: ErrorType.NETWORK,
};

/**
 * Default error messages to show for each error type
 */
const defaultErrorMessages: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Connection error. Please check your internet connection and try again.',
  [ErrorType.AUTH]: 'You are not authorized to perform this action. Please log in again.',
  [ErrorType.VALIDATION]: 'Please check your input and try again.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.SERVER]: 'There was a problem with the server. Please try again later.',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

/**
 * Error handler for client-side errors
 * @param error The error to handle
 * @param defaultMessage Optional default error message
 * @returns The error type and message
 */
export function handleClientError(
  error: unknown,
  defaultMessage?: string
): { type: ErrorType; message: string } {
  console.error('Client error:', error);

  // First check for network errors which are common with tRPC
  const networkError = handleNetworkError(error);
  if (networkError.isNetworkError) {
    return {
      type: ErrorType.NETWORK,
      message: networkError.message,
    };
  }

  // Handle TRPC client errors
  if (error instanceof TRPCClientError) {
    const code = error.data?.code;
    const type = code ? errorTypeMap[code] || ErrorType.UNKNOWN : ErrorType.UNKNOWN;
    const message = error.message || defaultErrorMessages[type];
    
    return { type, message };
  }

  // Handle other errors
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || defaultMessage || defaultErrorMessages[ErrorType.UNKNOWN],
    };
  }

  // Fallback for non-Error objects
  return {
    type: ErrorType.UNKNOWN,
    message: defaultMessage || defaultErrorMessages[ErrorType.UNKNOWN],
  };
}

/**
 * Shows a toast notification for the error
 * @param error The error to show
 * @param defaultMessage Optional default error message
 */
export function showErrorToast(error: unknown, defaultMessage?: string): void {
  const { type, message } = handleClientError(error, defaultMessage);
  
  addToast({
    title: `Error: ${type}`,
    description: message,
    color: 'danger',
    variant: 'bordered',
  });
}

/**
 * Type guard for TRPC client errors
 * @param error The error to check
 * @returns Whether the error is a TRPC client error
 */
export function isTRPCClientError(
  error: unknown
): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}

/**
 * Safely extracts the error message from an unknown error
 * @param error The error to extract the message from
 * @param fallback Optional fallback message
 * @returns The error message
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

/**
 * Handles specific network-related errors, including 'Failed to fetch' errors
 * This is common with tRPC when there are connection issues
 * @param error The error to analyze
 * @returns Whether the error is network-related and how to handle it
 */
export function handleNetworkError(error: unknown): { 
  isNetworkError: boolean; 
  message: string;
  shouldRetry: boolean;
} {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for common network error patterns
  const isFailedFetch = errorMessage.includes('Failed to fetch') || 
                        errorMessage.includes('fetch failed');
  const isNetworkError = isFailedFetch || 
                         errorMessage.includes('network') || 
                         errorMessage.includes('NetworkError') ||
                         errorMessage.includes('Network Error') ||
                         errorMessage.includes('CORS') ||
                         errorMessage.includes('ECONNREFUSED') ||
                         errorMessage.includes('ENOTFOUND') ||
                         errorMessage.includes('ETIMEDOUT');
  
  // Determine if the error is retryable
  const isServerError = errorMessage.includes('500') || 
                        errorMessage.includes('503') ||
                        errorMessage.includes('504');
  
  // For TRPCClientError with specific messages about quotes
  const isQuoteError = errorMessage.includes('quotes') || errorMessage.includes('quote');
  
  if (isFailedFetch) {
    return {
      isNetworkError: true,
      message: 'Connection to server failed. Please check your internet connection and try again.',
      shouldRetry: true
    };
  }
  
  if (isNetworkError) {
    return {
      isNetworkError: true,
      message: 'Network error occurred. Please check your connection and try again.',
      shouldRetry: true
    };
  }
  
  if (isServerError) {
    return {
      isNetworkError: true,
      message: 'The server is temporarily unavailable. Please try again later.',
      shouldRetry: true
    };
  }
  
  if (isQuoteError) {
    return {
      isNetworkError: true,
      message: 'Failed to fetch quotes. Please try again or contact support if the issue persists.',
      shouldRetry: true
    };
  }
  
  return {
    isNetworkError: false,
    message: errorMessage,
    shouldRetry: false
  };
} 