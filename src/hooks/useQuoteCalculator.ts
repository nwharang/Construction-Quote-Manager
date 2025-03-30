import { useMemo } from 'react';
import { 
  type Task, 
  type Material,
  type Quote
} from '~/types/quote';
import { 
  roundCurrency, 
  sumCurrency, 
  applyPercentage 
} from '~/utils/currency';
import { type QuoteSummaryData } from '~/components/quotes/QuoteSummary';

/**
 * Form data structure for editing a quote
 */
export interface QuoteFormData {
  id?: string;
  title: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  tasks: Task[];
  complexityPercentage: number;
  markupPercentage: number;
  taxRate?: number;
  status?: Quote['status'];
  validUntil?: Date;
}

/**
 * Hook to handle all quote calculations
 * Follows the business rules from Context.md for calculations
 */
export function useQuoteCalculator(quoteData: Partial<QuoteFormData>) {
  const { tasks = [], complexityPercentage = 0, markupPercentage = 0, taxRate = 0 } = quoteData;
  
  /**
   * Calculate total for a single task
   */
  const calculateTaskTotal = (task: Task): number => {
    return task.price || 0;
  };
  
  /**
   * Calculate total for a single material
   */
  const calculateMaterialTotal = (material: Material): number => {
    const quantity = material.quantity || 0;
    const unitPrice = material.unitPrice || 0;
    return roundCurrency(quantity * unitPrice);
  };
  
  /**
   * Calculate totals for all tasks
   */
  const calculateTasksTotals = (tasks: Task[]): number => {
    return sumCurrency(tasks.map(calculateTaskTotal));
  };
  
  /**
   * Calculate totals for all materials
   */
  const calculateMaterialsTotals = (tasks: Task[]): number => {
    const allMaterials = tasks.flatMap(task => task.materials || []);
    return sumCurrency(allMaterials.map(calculateMaterialTotal));
  };
  
  /**
   * Compute all the quote totals and return a memoized object
   */
  const calculatedTotals = useMemo<QuoteSummaryData>(() => {
    const tasksTotal = calculateTasksTotals(tasks);
    const materialsTotal = calculateMaterialsTotals(tasks);
    const subtotal = sumCurrency([tasksTotal, materialsTotal]);
    
    const complexityCharge = applyPercentage(subtotal, complexityPercentage);
    const markupCharge = applyPercentage(subtotal, markupPercentage);
    
    const subtotalWithAdjustments = sumCurrency([
      subtotal,
      complexityCharge,
      markupCharge
    ]);
    
    const taxAmount = taxRate ? applyPercentage(subtotalWithAdjustments, taxRate) : 0;
    const total = sumCurrency([subtotalWithAdjustments, taxAmount]);
    
    return {
      subtotal,
      complexityCharge,
      markupCharge,
      taxRate,
      taxAmount,
      total
    };
  }, [tasks, complexityPercentage, markupPercentage, taxRate]);
  
  return {
    calculateTaskTotal,
    calculateMaterialTotal,
    calculateTasksTotals,
    calculateMaterialsTotals,
    calculatedTotals
  };
} 