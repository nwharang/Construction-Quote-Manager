'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useAppToast } from '~/components/providers/ToastProvider';

export interface UseEntityFormOptions<T> {
  initialData?: T | undefined;
  defaultValues: T;
  schema: z.ZodType<T>;
  onSubmit: (data: T) => Promise<void>;
  successMessage?: {
    create: string;
    update: string;
  };
}

export function useEntityForm<T extends object>({
  initialData,
  defaultValues,
  schema,
  onSubmit,
  successMessage = {
    create: 'Created successfully',
    update: 'Updated successfully',
  },
}: UseEntityFormOptions<T>) {
  const isEdit = !!initialData;
  const toast = useAppToast();
  
  // Initialize form data with existing data or defaults
  const [formData, setFormData] = useState<T>(() => {
    if (initialData) {
      return { ...defaultValues, ...initialData };
    }
    return defaultValues;
  });
  
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle field changes
  const handleChange = (field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear errors when field is modified
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const result = schema.safeParse(formData);
    if (!result.success) {
      const newErrors: Partial<Record<keyof T, string>> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof T;
        newErrors[path] = err.message;
      });
      setFormErrors(newErrors);
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (data: T) => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(data);
      toast.success(isEdit ? successMessage.update : successMessage.create);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    formErrors,
    isSubmitting,
    isEdit,
    handleChange,
    handleSubmit,
    validateForm,
    setFormData,
    setFormErrors
  };
} 