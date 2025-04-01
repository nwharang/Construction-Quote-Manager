import { useCallback } from 'react';
import { type RouterInputs } from '~/utils/api';
import { useQuoteStore } from '~/store/quoteStore';

type QuoteFormData = RouterInputs['quote']['create'];

interface Task {
  description: string;
  price: number;
  hours?: number;
  rate?: number;
  materials?: {
    name: string;
    quantity: number;
    unitPrice: number;
    productId?: string;
  }[];
}

interface QuoteSummaryResult {
  subtotal: number;
  complexity: number;
  markup: number;
  tax: number;
  grandTotal: number;
}

export const useQuoteForm = () => {
  const { formData, updateField } = useQuoteStore();

  // Calculate subtotal from tasks
  const calculateSubtotal = useCallback((data: QuoteFormData) => {
    const laborSubtotal = data.tasks?.reduce((sum, task) => {
      // Handle both old (price-based) and new (hours*rate) task models
      if ('hours' in task && 'rate' in task) {
        const hours = Number(task.hours) || 0;
        const rate = Number(task.rate) || 0;
        return sum + (hours * rate);
      }
      return sum + (Number(task.price) || 0);
    }, 0) || 0;

    const materialsSubtotal = data.tasks?.reduce((sum, task) => {
      return sum + (task.materials?.reduce(
        (materialSum, material) => {
          const quantity = Number(material.quantity) || 0;
          const unitPrice = Number(material.unitPrice) || 0;
          return materialSum + (quantity * unitPrice);
        },
        0
      ) || 0);
    }, 0) || 0;

    return laborSubtotal + materialsSubtotal;
  }, []);

  // Calculate quote totals
  const calculateQuoteTotals = useCallback((data: QuoteFormData): QuoteSummaryResult => {
    const subtotal = calculateSubtotal(data);
    
    const complexityPercentage = Number(data.complexityPercentage) || 0;
    const complexity = subtotal * (complexityPercentage / 100);
    
    const markupPercentage = Number(data.markupPercentage) || 0;
    const markup = subtotal * (markupPercentage / 100);
    
    // Use taxPercentage if available, default to 0
    const taxPercentage = ('taxPercentage' in data ? Number(data.taxPercentage) : 0) || 0;
    const tax = (subtotal + complexity + markup) * (taxPercentage / 100);
    
    const grandTotal = subtotal + complexity + markup + tax;
    
    return {
      subtotal,
      complexity,
      markup,
      tax,
      grandTotal
    };
  }, [calculateSubtotal]);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof QuoteFormData, value: any) => {
    updateField(field, value);
  }, [updateField]);

  // Validate the form
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!formData.title) {
      errors.title = 'Title is required';
    }
    
    if (!formData.customerId) {
      errors.customerId = 'Customer is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [formData]);

  return {
    calculateSubtotal,
    calculateQuoteTotals,
    handleFieldChange,
    validateForm
  };
}; 