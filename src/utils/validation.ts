import { useTranslation } from '~/hooks/useTranslation';
import { z } from 'zod';
import type { TranslationValues } from '~/utils/i18n';

/**
 * Custom hook for creating validation schemas with translated error messages
 * Ensures consistent validation messaging across the application
 */
export function useValidationSchema() {
  const { t } = useTranslation();

  const getErrorMessage = (key: string, params?: Record<string, any>): string => {
    if (params) {
      return t(`errors.${key}`, params as TranslationValues);
    }
    return t(`errors.${key}`);
  };

  /**
   * Common validation rules that can be used across the application
   */
  const rules = {
    required: () => z.string().min(1, getErrorMessage('requiredField')),
    email: () => 
      z.string()
        .min(1, getErrorMessage('requiredField'))
        .email(getErrorMessage('invalidEmail')),
    password: (minLength = 8) => 
      z.string()
        .min(1, getErrorMessage('requiredField'))
        .min(minLength, getErrorMessage('minimumLength', { length: minLength })),
    name: (minLength = 2, maxLength = 100) => 
      z.string()
        .min(1, getErrorMessage('requiredField'))
        .min(minLength, getErrorMessage('minimumLength', { length: minLength }))
        .max(maxLength, getErrorMessage('maximumLength', { length: maxLength })),
    phone: () => 
      z.string()
        .min(1, getErrorMessage('requiredField'))
        .regex(/^\+?[0-9\s\-()]+$/, getErrorMessage('invalidFormat')),
    number: (options?: { min?: number, max?: number }) => {
      let schema = z.number({ 
        invalid_type_error: getErrorMessage('invalidNumber') 
      });
      
      if (options?.min !== undefined) {
        schema = schema.min(options.min, `${getErrorMessage('minimumValue')} ${options.min}`);
      }
      
      if (options?.max !== undefined) {
        schema = schema.max(options.max, `${getErrorMessage('maximumValue')} ${options.max}`);
      }
      
      return schema;
    },
    date: () => 
      z.date({ 
        invalid_type_error: getErrorMessage('invalidDate')
      }),
    currencyAmount: (options?: { min?: number, max?: number }) => {
      let schema = z.number({ 
        invalid_type_error: getErrorMessage('invalidNumber')
      }).multipleOf(0.01, getErrorMessage('invalidCurrencyFormat'));
      
      if (options?.min !== undefined) {
        schema = schema.min(options.min, `${getErrorMessage('minimumValue')} ${options.min}`);
      }
      
      if (options?.max !== undefined) {
        schema = schema.max(options.max, `${getErrorMessage('maximumValue')} ${options.max}`);
      }
      
      return schema;
    },
    percentage: (options?: { min?: number, max?: number }) => {
      let schema = z.number({ 
        invalid_type_error: getErrorMessage('invalidNumber')
      });
      
      const min = options?.min ?? 0;
      const max = options?.max ?? 100;
      
      return schema
        .min(min, `${getErrorMessage('minimumValue')} ${min}%`)
        .max(max, `${getErrorMessage('maximumValue')} ${max}%`);
    },
    minLength: (length: number) => 
      z.string().min(length, getErrorMessage('minimumLength', { length })),
    maxLength: (length: number) => 
      z.string().max(length, getErrorMessage('maximumLength', { length })),
    url: () => 
      z.string().url(getErrorMessage('invalidUrl')),
    uuid: () => 
      z.string().uuid(getErrorMessage('invalidFormat')),
    nonEmptyArray: <T>(schema: z.ZodType<T>) => 
      z.array(schema)
        .min(1, getErrorMessage('arrayMinLength', { length: 1 })),
  };

  return {
    rules,
    getErrorMessage,
  };
}

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
export function validateForm<T>(schema: z.ZodSchema<T>, data: any): { 
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

/**
 * Formats a validation error message for screen readers
 * @param fieldName The name of the field
 * @param errorMessage The error message
 * @returns Formatted error message for screen readers
 */
export function formatErrorForScreenReader(fieldName: string, errorMessage: string): string {
  return `${fieldName}: ${errorMessage}`;
}

/**
 * Generates HTML attributes for form fields with validation states
 * Ensures consistent accessibility attributes across all form fields
 * 
 * @param id The ID of the form field
 * @param isInvalid Whether the field is in an invalid state
 * @param isRequired Whether the field is required
 * @param errorId The ID of the element containing the error message
 * @param helpTextId The ID of the element containing help text
 * @returns HTML attributes for the form field
 */
export function getFieldAttributes(
  id: string,
  isInvalid: boolean,
  isRequired: boolean = false,
  errorId?: string,
  helpTextId?: string
): Record<string, string | boolean | undefined> {
  const describedByIds: string[] = [];
  
  if (errorId) {
    describedByIds.push(errorId);
  }
  
  if (helpTextId) {
    describedByIds.push(helpTextId);
  }
  
  const describedBy = describedByIds.length > 0 
    ? describedByIds.join(' ') 
    : undefined;
  
  return {
    id,
    'aria-invalid': isInvalid ? 'true' : undefined,
    'aria-required': isRequired ? 'true' : undefined,
    'aria-describedby': describedBy,
  };
} 