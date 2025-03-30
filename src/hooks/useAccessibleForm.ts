import { useState, useId } from 'react';
import { useTranslation } from './useTranslation';
import { validateForm } from '../utils/validation';
import { z } from 'zod';

/**
 * Creates an accessible ID by combining a prefix and suffix
 * Used to ensure unique IDs for form elements and their associated labels
 * 
 * @param prefix The prefix for the ID (usually component or form related)
 * @param suffix The suffix for the ID (usually field name)
 * @returns A unique ID string
 */
export function createAccessibleId(prefix: string, suffix: string): string {
  // Sanitize inputs to ensure valid HTML IDs
  const sanitizedPrefix = prefix.replace(/[^a-zA-Z0-9-_]/g, '');
  const sanitizedSuffix = suffix.replace(/[^a-zA-Z0-9-_]/g, '');
  
  return `${sanitizedPrefix}-${sanitizedSuffix}`;
}

/**
 * Custom hook for creating accessible forms with consistent validation and error handling
 * 
 * @param schema Zod schema for validation
 * @param onSubmit Function to call when the form is submitted and valid
 * @param initialValues Initial form values
 * @returns Form state and helper functions
 */
export function useAccessibleForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  onSubmit: (data: T) => void | Promise<void>,
  initialValues: Partial<T> = {}
) {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formId = useId();
  const { t } = useTranslation();

  // Handle field change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle number inputs
    const finalValue = type === 'number' 
      ? value === '' ? undefined : parseFloat(value)
      : value;
      
    setValues((prev) => ({ ...prev, [name]: finalValue }));
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
    
    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle number input value change
  const handleNumberChange = (name: string, value: number | undefined) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
    
    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle checkbox/radio change
  const handleCheckedChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, checked, type, value } = e.target;
    
    const finalValue = type === 'checkbox' 
      ? checked 
      : value;
      
    setValues((prev) => ({ ...prev, [name]: finalValue }));
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
    
    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle blur event for field validation
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
    
    // We'll use validateForm from utils for simplicity
    // This is a simplified approach that doesn't try to validate individual fields
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(values).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // Validate all fields
    const validation = validateForm(schema, values as T);
    
    if (!validation.success) {
      setErrors(validation.errors || {});
      
      // Focus the first field with an error
      const firstErrorField = Object.keys(validation.errors || {})[0];
      if (firstErrorField) {
        const element = document.getElementById(getFieldId(firstErrorField));
        if (element) {
          element.focus();
          
          // Announce error to screen readers
          const errorMessage = validation.errors?.[firstErrorField];
          if (errorMessage) {
            announceValidationError(firstErrorField, errorMessage);
          }
        }
      }
      
      return;
    }
    
    // Clear any existing errors
    setErrors({});
    
    // Submit the form
    try {
      setIsSubmitting(true);
      await onSubmit(validation.data as T);
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Set a general form error
      setErrors({
        form: t('errors.somethingWentWrong')
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset the form
  const resetForm = (newValues: Partial<T> = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };
  
  // Get a unique ID for a field
  const getFieldId = (name: string): string => {
    return createAccessibleId(`${formId}-field`, name);
  };
  
  // Generate props for a form field
  const getFieldProps = (name: string, label: string, options?: {
    isRequired?: boolean;
    helpText?: string;
  }) => {
    const fieldId = getFieldId(name);
    const errorId = errors[name] ? `${fieldId}-error` : undefined;
    const helpTextId = options?.helpText ? `${fieldId}-help` : undefined;
    
    // Combine IDs for aria-describedby
    const describedByIds: string[] = [];
    if (errorId) describedByIds.push(errorId);
    if (helpTextId) describedByIds.push(helpTextId);
    
    return {
      id: fieldId,
      name,
      value: values[name as keyof typeof values] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      'aria-invalid': !!errors[name],
      'aria-describedby': describedByIds.length > 0 ? describedByIds.join(' ') : undefined,
      'aria-required': options?.isRequired ? 'true' : undefined,
      error: errors[name],
      errorId,
      helpTextId,
      label,
      helpText: options?.helpText,
      isRequired: !!options?.isRequired,
    };
  };
  
  // Announce validation error to screen readers using ARIA live region
  const announceValidationError = (fieldName: string, errorMessage: string) => {
    // Find or create a live region
    let liveRegion = document.getElementById('form-announcer');
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'form-announcer';
      liveRegion.setAttribute('aria-live', 'assertive');
      liveRegion.setAttribute('role', 'status');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    // Set the message
    liveRegion.textContent = `${t('form.fieldError')}: ${errorMessage}`;
    
    // Clear after screen readers have had time to announce
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 3000);
  };
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleNumberChange,
    handleCheckedChange,
    handleBlur,
    handleSubmit,
    resetForm,
    getFieldId,
    getFieldProps,
  };
} 