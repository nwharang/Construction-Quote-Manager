import { useState, useCallback, useMemo } from 'react';
import { roundCurrency, calculateQuoteTotals } from '~/server/utils/calculations';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;
type QuoteResponse = NonNullable<RouterOutput['quote']['getById']>;
type Task = NonNullable<QuoteResponse['tasks']>[number];

export interface QuoteSummaryData {
  subtotalTasks: number;
  subtotalMaterials: number;
  complexityCharge: number;
  markupCharge: number;
  grandTotal: number;
}

interface UseQuoteCalculationsProps {
  initialTasks?: Task[];
  initialComplexityPercentage?: number;
  initialMarkupPercentage?: number;
}

/**
 * Custom hook for handling quote calculations
 * Uses the same calculation logic as the backend for consistency
 */
export function useQuoteCalculations({
  initialTasks = [],
  initialComplexityPercentage = 0,
  initialMarkupPercentage = 10,
}: UseQuoteCalculationsProps = {}) {
  // State for tasks and charges
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [complexityPercentage, setComplexityPercentage] = useState(initialComplexityPercentage);
  const [markupPercentage, setMarkupPercentage] = useState(initialMarkupPercentage);

  // Calculate all totals whenever tasks or percentages change
  const summary = useMemo((): QuoteSummaryData => {
    const totals = calculateQuoteTotals(tasks, complexityPercentage, markupPercentage);
    
    return {
      subtotalTasks: totals.subtotalTasks,
      subtotalMaterials: totals.subtotalMaterials,
      complexityCharge: totals.complexityCharge,
      complexityPercentage,
      markupCharge: totals.markupCharge,
      markupPercentage,
      grandTotal: totals.grandTotal,
    };
  }, [tasks, complexityPercentage, markupPercentage]);

  // Task management functions
  const addTask = useCallback(() => {
    setTasks((prevTasks) => [
      ...prevTasks,
      {
        id: crypto.randomUUID(),
        quoteId: '', // Will be assigned when saved
        description: '',
        price: 0,
        order: prevTasks.length,
        materialType: 'lumpsum',
        estimatedMaterialsCostLumpSum: 0,
        materials: [],
      },
    ]);
  }, []);

  const updateTask = useCallback((index: number, updates: Partial<Task>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task, i) => (i === index ? { ...task, ...updates } : task))
    );
  }, []);

  const removeTask = useCallback((index: number) => {
    setTasks((prevTasks) => prevTasks.filter((_, i) => i !== index));
  }, []);

  // Material management functions
  const addMaterial = useCallback(
    (taskIndex: number, material: Omit<Task['materials'][0], 'id' | 'taskId'>) => {
      setTasks((prevTasks) =>
        prevTasks.map((task, i) =>
          i === taskIndex
            ? {
                ...task,
                materialType: 'itemized', // Switch to itemized when adding material
                materials: [
                  ...task.materials,
                  {
                    id: crypto.randomUUID(),
                    taskId: task.id,
                    ...material,
                  },
                ],
              }
            : task
        )
      );
    },
    []
  );

  const updateMaterial = useCallback(
    (taskIndex: number, materialIndex: number, updates: Partial<Task['materials'][0]>) => {
      setTasks((prevTasks) =>
        prevTasks.map((task, i) =>
          i === taskIndex
            ? {
                ...task,
                materials: task.materials.map((material, j) =>
                  j === materialIndex ? { ...material, ...updates } : material
                ),
              }
            : task
        )
      );
    },
    []
  );

  const removeMaterial = useCallback((taskIndex: number, materialIndex: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task, i) =>
        i === taskIndex
          ? {
              ...task,
              materials: task.materials.filter((_, j) => j !== materialIndex),
            }
          : task
      )
    );
  }, []);

  // Percentage update handlers
  const updateComplexityPercentage = useCallback((percentage: number) => {
    setComplexityPercentage(roundCurrency(percentage));
  }, []);

  const updateMarkupPercentage = useCallback((percentage: number) => {
    setMarkupPercentage(roundCurrency(percentage));
  }, []);

  // Calculate task total
  const getTaskTotal = useCallback((task: Task) => {
    const laborCost = task.price || 0;
    const materialsCost = task.materialType === 'ITEMIZED' 
      ? task.materials?.reduce((sum, material) => 
          sum + (material.quantity || 0) * (material.unitPrice || 0), 0) || 0
      : task.estimatedMaterialsCost || 0;
    return laborCost + materialsCost;
  }, []);

  // Calculate materials total
  const getMaterialsTotal = useCallback((task: Task) => {
    if (task.materialType === 'ITEMIZED') {
      return task.materials?.reduce((sum, material) => 
        sum + (material.quantity || 0) * (material.unitPrice || 0), 0) || 0;
    }
    return task.estimatedMaterialsCost || 0;
  }, []);

  // Calculate labor total
  const getLaborTotal = useCallback((task: Task) => {
    return task.price || 0;
  }, []);

  // Calculate quote totals
  const calculateTotals = useCallback((tasks: Task[]): QuoteSummaryData => {
    const subtotalTasks = tasks.reduce((sum, task) => sum + getLaborTotal(task), 0);
    const subtotalMaterials = tasks.reduce((sum, task) => sum + getMaterialsTotal(task), 0);
    const complexityCharge = 0; // TODO: Implement complexity charge calculation
    const markupCharge = 0; // TODO: Implement markup charge calculation
    const grandTotal = subtotalTasks + subtotalMaterials + complexityCharge + markupCharge;

    return {
      subtotalTasks,
      subtotalMaterials,
      complexityCharge,
      markupCharge,
      grandTotal,
    };
  }, [getLaborTotal, getMaterialsTotal]);

  return {
    tasks,
    complexityPercentage,
    markupPercentage,
    summary,
    addTask,
    updateTask,
    removeTask,
    addMaterial,
    updateMaterial,
    removeMaterial,
    updateComplexityPercentage,
    updateMarkupPercentage,
    getTaskTotal,
    getMaterialsTotal,
    getLaborTotal,
    calculateTotals,
  };
} 