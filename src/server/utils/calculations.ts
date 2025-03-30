/**
 * Calculation utilities for quotes
 * Implements the business logic for quote calculations
 * Follows the requirements in Context.md to ensure backend authority
 */

import { type Task, type Material } from '~/types/quote';

/**
 * Rounds a number to 2 decimal places for consistent currency handling
 * @param value Number to round
 * @returns Rounded value
 */
export const roundCurrency = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Calculate the total for a material
 * @param material Material object with quantity and unitPrice
 * @returns Total price for the material
 */
export const calculateMaterialTotal = (material: {
  quantity: number;
  unitPrice: number;
}): number => {
  return roundCurrency(material.quantity * material.unitPrice);
};

/**
 * Calculate the materials total for a task
 * @param task Task object
 * @returns Total price for all materials in the task
 */
export const calculateTaskMaterialsTotal = (task: {
  materialType?: 'lumpsum' | 'itemized';
  estimatedMaterialsCostLumpSum?: number;
  materials?: Array<{ quantity: number; unitPrice: number }>;
}): number => {
  if (task.materialType === 'lumpsum' && typeof task.estimatedMaterialsCostLumpSum === 'number') {
    return roundCurrency(task.estimatedMaterialsCostLumpSum);
  }

  if (task.materialType === 'itemized' && Array.isArray(task.materials)) {
    const total = task.materials.reduce(
      (sum, material) => sum + calculateMaterialTotal(material),
      0
    );
    return roundCurrency(total);
  }

  return 0;
};

/**
 * Calculate the task total (labor + materials)
 * @param task Task object
 * @returns Total price for the task
 */
export const calculateTaskTotal = (task: {
  price?: number;
  materialType?: 'lumpsum' | 'itemized';
  estimatedMaterialsCostLumpSum?: number;
  materials?: Array<{ quantity: number; unitPrice: number }>;
}): number => {
  const taskPrice = task.price || 0;
  const materialsTotal = calculateTaskMaterialsTotal(task);
  return roundCurrency(taskPrice + materialsTotal);
};

/**
 * Calculate all subtotals and totals for a quote
 * @param tasks Array of tasks
 * @param complexityCharge Complexity charge percentage
 * @param markupPercentage Markup percentage
 * @returns Object with all calculated values
 */
export const calculateQuoteTotals = (
  tasks: Task[],
  complexityCharge: number = 0,
  markupPercentage: number = 0
): {
  subtotalTasks: number;
  subtotalMaterials: number;
  subtotalCombined: number;
  complexityCharge: number;
  markupCharge: number;
  grandTotal: number;
} => {
  // Calculate task and material subtotals
  const subtotalTasks = roundCurrency(
    tasks.reduce((sum, task) => sum + (task.price || 0), 0)
  );

  const subtotalMaterials = roundCurrency(
    tasks.reduce((sum, task) => sum + calculateTaskMaterialsTotal(task), 0)
  );

  const subtotalCombined = roundCurrency(subtotalTasks + subtotalMaterials);
  
  // Calculate charges
  const calculatedComplexityCharge = roundCurrency(subtotalCombined * (complexityCharge / 100));
  
  const markupBase = subtotalCombined + calculatedComplexityCharge;
  const calculatedMarkupCharge = roundCurrency(markupBase * (markupPercentage / 100));
  
  // Calculate grand total
  const grandTotal = roundCurrency(subtotalCombined + calculatedComplexityCharge + calculatedMarkupCharge);

  return {
    subtotalTasks,
    subtotalMaterials,
    subtotalCombined,
    complexityCharge: calculatedComplexityCharge,
    markupCharge: calculatedMarkupCharge,
    grandTotal,
  };
}; 