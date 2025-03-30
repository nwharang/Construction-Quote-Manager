import React from 'react';

interface FormErrorMessageProps {
  /** Error message to display */
  message: string;
  /** ID for the error message, used for aria-describedby */
  id?: string;
  /** Optional CSS class name */
  className?: string;
  /** If true, message will only be available to screen readers */
  srOnly?: boolean;
}

/**
 * Standardized component for displaying form error messages in a consistent and accessible way
 * Implements a11y best practices with proper ARIA roles
 * Follows HeroUI design patterns
 */
export function FormErrorMessage({
  message,
  id,
  className = '',
  srOnly = false,
}: FormErrorMessageProps) {
  if (!message) return null;
  
  const baseClasses = srOnly 
    ? 'sr-only' 
    : 'mt-2 text-sm text-danger font-medium';
  
  return (
    <div 
      id={id}
      className={`${baseClasses} ${className}`} 
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

/**
 * Utility function to format an error message for screen readers
 * @param fieldName The name of the field (or label)
 * @param errorMessage The error message
 * @returns Formatted error message for screen readers
 */
export function formatErrorForScreenReader(fieldName: string, errorMessage: string): string {
  return `${fieldName}: ${errorMessage}`;
} 