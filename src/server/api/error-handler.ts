import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { logger } from '../../server/logger';

/**
 * TRPC error codes and their HTTP status codes
 */
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST', // 400
  UNAUTHORIZED = 'UNAUTHORIZED', // 401
  FORBIDDEN = 'FORBIDDEN', // 403
  NOT_FOUND = 'NOT_FOUND', // 404
  TIMEOUT = 'TIMEOUT', // 408
  CONFLICT = 'CONFLICT', // 409
  PRECONDITION_FAILED = 'PRECONDITION_FAILED', // 412
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE', // 413
  METHOD_NOT_SUPPORTED = 'METHOD_NOT_SUPPORTED', // 405
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS', // 429
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR', // 500
}

/**
 * Maps Drizzle ORM error codes/types to TRPC error codes
 */
const databaseErrorMap = new Map<string, ErrorCode>([
  ['unique violation', ErrorCode.CONFLICT],
  ['not_found', ErrorCode.NOT_FOUND],
  ['foreign_key_violation', ErrorCode.CONFLICT],
]);

/**
 * Handles database errors by converting them to TRPC errors
 * @param error The database error to handle
 * @returns A TRPC error
 */
export function handleDatabaseError(error: Error): TRPCError {
  const errorMessage = error.message.toLowerCase();
  
  // Try to determine error type from message
  let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
  
  // Check for common database errors in the message
  for (const [pattern, code] of databaseErrorMap.entries()) {
    if (errorMessage.includes(pattern)) {
      errorCode = code;
      break;
    }
  }
  
  // Handle not found errors
  if (errorMessage.includes('no rows') || errorMessage.includes('not found')) {
    errorCode = ErrorCode.NOT_FOUND;
  }
  
  // Handle unique constraint errors
  if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
    errorCode = ErrorCode.CONFLICT;
  }
  
  logger.error(`Database error`, {
    error,
    code: errorCode,
    message: error.message,
  });
  
  return new TRPCError({
    code: errorCode,
    message: getDatabaseErrorMessageForClient(errorMessage, errorCode),
    cause: error,
  });
}

/**
 * Gets a user-friendly error message for a database error
 */
function getDatabaseErrorMessageForClient(errorMessage: string, code: ErrorCode): string {
  switch (code) {
    case ErrorCode.CONFLICT:
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return 'A record with this information already exists.';
      }
      if (errorMessage.includes('foreign key')) {
        return 'This operation references data that does not exist.';
      }
      return 'This operation conflicts with existing data.';
    
    case ErrorCode.NOT_FOUND:
      return 'The requested record was not found.';
      
    default:
      return 'An unexpected database error occurred.';
  }
}

/**
 * Handles Zod validation errors by converting them to TRPC errors
 * @param error The Zod error to handle
 * @returns A TRPC error
 */
export function handleZodError(error: ZodError): TRPCError {
  const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
  
  logger.warn('Validation error', {
    error: error,
    message,
  });
  
  return new TRPCError({
    code: ErrorCode.BAD_REQUEST,
    message,
    cause: error,
  });
}

/**
 * Handles unknown errors by converting them to TRPC errors
 * @param error The unknown error to handle
 * @returns A TRPC error
 */
export function handleUnknownError(error: unknown): TRPCError {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  logger.error('Unknown server error', {
    error,
    message: errorMessage,
  });
  
  return new TRPCError({
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: 'An unexpected server error occurred.',
    cause: error,
  });
}

/**
 * Centralized error handler for server-side errors
 * @param error The error to handle
 * @returns A TRPC error
 */
export function handleServerError(error: unknown): TRPCError {
  // Handle database errors (we assume any Error with specific DB-related terms is a DB error)
  if (error instanceof Error && (
    error.message.includes('database') || 
    error.message.includes('unique') ||
    error.message.includes('foreign key') ||
    error.message.includes('not found') ||
    error.message.includes('no rows')
  )) {
    return handleDatabaseError(error);
  }
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return handleZodError(error);
  }
  
  // Handle existing TRPC errors
  if (error instanceof TRPCError) {
    logger.error(`TRPC error: ${error.code}`, {
      error,
      code: error.code,
      message: error.message,
    });
    return error;
  }
  
  // Handle other errors
  return handleUnknownError(error);
} 