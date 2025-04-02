import { z } from 'zod';

/**
 * Utility function for extracting Zod validation errors into a simple object format
 * for consistent error display across the application
 */
export function extractZodErrors(result: z.SafeParseError<any>): Record<string, string> {
  const errors: Record<string, string> = {};

  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path || issue.code] = issue.message;
  });

  return errors;
}

/**
 * Utility function to validate form data and handle errors consistently
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Object with success status and errors or validated data
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: any
): {
  success: boolean;
  errors?: Record<string, string>;
  data?: T;
} {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: extractZodErrors(result),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
