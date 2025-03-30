import { useState, useCallback } from 'react';
import { type Task, type Material } from '~/types/quote';
import { roundCurrency } from '~/utils/currency';

interface UseTaskManagementProps {
  initialTasks?: Task[];
}

/**
 * Custom hook for managing tasks in quotes
 * Provides consistent task management functions
 */
export function useTaskManagement({ initialTasks = [] }: UseTaskManagementProps = {}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  /**
   * Add a new empty task
   */
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

  /**
   * Update a task field
   * @param index Task index
   * @param e Change event
   */
  const handleTaskChange = useCallback(
    (
      index: number,
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;
      setTasks((prevTasks) =>
        prevTasks.map((task, i) => (i === index ? { ...task, [name]: value } : task))
      );
    },
    []
  );

  /**
   * Update a numeric task field with proper rounding
   * @param index Task index
   * @param name Field name
   * @param value Numeric value
   */
  const handleNumberChange = useCallback((index: number, name: string, value: number) => {
    const roundedValue = roundCurrency(value);
    setTasks((prevTasks) =>
      prevTasks.map((task, i) => (i === index ? { ...task, [name]: roundedValue } : task))
    );
  }, []);

  /**
   * Remove a task
   * @param index Task index
   */
  const removeTask = useCallback((index: number) => {
    setTasks((prevTasks) => prevTasks.filter((_, i) => i !== index));
  }, []);

  /**
   * Add a material to a task
   * @param taskIndex Task index
   * @param material Material data
   */
  const addMaterial = useCallback(
    (taskIndex: number, material: Omit<Material, 'id' | 'taskId'>) => {
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

  /**
   * Update a material
   * @param taskIndex Task index
   * @param materialIndex Material index
   * @param updates Material updates
   */
  const updateMaterial = useCallback(
    (taskIndex: number, materialIndex: number, updates: Partial<Material>) => {
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

  /**
   * Update a numeric material field with proper rounding
   * @param taskIndex Task index
   * @param materialIndex Material index
   * @param name Field name
   * @param value Numeric value
   */
  const updateMaterialNumber = useCallback(
    (taskIndex: number, materialIndex: number, name: string, value: number) => {
      const roundedValue = roundCurrency(value);
      updateMaterial(taskIndex, materialIndex, { [name]: roundedValue } as Partial<Material>);
    },
    [updateMaterial]
  );

  /**
   * Remove a material
   * @param taskIndex Task index
   * @param materialIndex Material index
   */
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

  /**
   * Reorder tasks
   * @param newOrder New order of tasks
   */
  const reorderTasks = useCallback((newOrder: Task[]) => {
    setTasks(
      newOrder.map((task, index) => ({
        ...task,
        order: index,
      }))
    );
  }, []);

  return {
    tasks,
    addTask,
    handleTaskChange,
    handleNumberChange,
    removeTask,
    addMaterial,
    updateMaterial,
    updateMaterialNumber,
    removeMaterial,
    reorderTasks,
    setTasks,
  };
} 