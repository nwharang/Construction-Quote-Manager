"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '~/utils/api';
import type { RouterOutputs } from '~/utils/api';
import { useAppToast } from '~/components/providers/ToastProvider';
import { useTranslation } from '~/hooks/useTranslation';

// Define types based on the database schema
type Quote = RouterOutputs['quote']['getById'];
type Task = RouterOutputs['task']['getByQuoteId'][number];
type Material = Task['materials'][number];
type Product = RouterOutputs['product']['getAll']['items'][number];

// Types for form data
interface QuoteFormData {
  title: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  complexityCharge: number;
  markupCharge: number;
}

interface TaskFormData {
  id?: string;
  name: string;
  description?: string;
  price: string;
  quantity: number;
  materialType: 'lumpsum' | 'itemized';
  estimatedMaterialsCostLumpSum: number;
  materials: MaterialFormData[];
}

interface MaterialFormData {
  id?: string;
  productId: string;
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

interface QuoteTotals {
  subtotalTasks: number;
  subtotalMaterials: number;
  complexityCharge: number;
  markupCharge: number;
  grandTotal: number;
}

// Define the context type
interface QuotesContextType {
  // Form state
  quoteFormData: QuoteFormData;
  tasks: TaskFormData[];
  products: Product[];
  
  // Quote data for details view
  currentQuote: Quote | null;
  loading: boolean;

  // Quote calculations
  calculateTotals: () => QuoteTotals;
  
  // Form handlers
  setQuoteFormData: (data: Partial<QuoteFormData>) => void;
  addTask: () => void;
  updateTask: (index: number, task: Partial<TaskFormData>) => void;
  removeTask: (index: number) => void;
  addMaterial: (taskIndex: number, material?: Partial<MaterialFormData>) => void;
  updateMaterial: (taskIndex: number, materialIndex: number, material: Partial<MaterialFormData>) => void;
  removeMaterial: (taskIndex: number, materialIndex: number) => void;
  
  // API actions
  createQuote: () => Promise<string | undefined>;
  updateQuote: (quoteId: string) => Promise<boolean>;
  deleteQuote: (quoteId: string) => Promise<boolean>;
  fetchQuoteById: (quoteId: string) => Promise<void>;
  updateQuoteStatus: (quoteId: string, status: string) => Promise<boolean>;
  
  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  resetForm: () => void;
}

// Create the context with a default value
const QuotesContext = createContext<QuotesContextType | undefined>(undefined);

// Default values for the form
const defaultQuoteFormData: QuoteFormData = {
  title: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  notes: '',
  complexityCharge: 0,
  markupCharge: 0,
};

const defaultTaskData: TaskFormData = {
  name: '',
  description: '',
  price: '0',
  quantity: 1,
  materialType: 'lumpsum',
  estimatedMaterialsCostLumpSum: 0,
  materials: [],
};

// Provider component
export function QuotesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const toast = useAppToast();
  const { formatCurrency } = useTranslation();
  
  // State for form data
  const [quoteFormData, setQuoteFormDataState] = useState<QuoteFormData>(defaultQuoteFormData);
  const [tasks, setTasks] = useState<TaskFormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add state for current quote view
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Get products for material selection
  const { data: productData } = api.product.getAll.useQuery(
    {},
    { 
      enabled: status === 'authenticated',
      refetchOnWindowFocus: true,
      refetchOnMount: true 
    }
  );
  
  // API mutations
  const createQuoteMutation = api.quote.create.useMutation();
  const createTaskMutation = api.task.create.useMutation();
  const createMaterialMutation = api.material.create.useMutation();
  const updateQuoteMutation = api.quote.update.useMutation();
  const updateTaskMutation = api.task.update.useMutation();
  const updateMaterialMutation = api.material.update.useMutation();
  const deleteQuoteMutation = api.quote.delete.useMutation();
  const deleteTaskMutation = api.task.delete.useMutation();
  const deleteMaterialMutation = api.material.delete.useMutation();
  
  // Get the API context for cache invalidation
  const utils = api.useContext();
  
  // Initialize with settings
  const { data: settings } = api.settings.get.useQuery(
    undefined,
    { enabled: !!session }
  );
  
  // Use effect to apply settings when they load
  useEffect(() => {
    // Initialize with default values from settings
    if (settings) {
      setQuoteFormDataState(prev => ({
        ...prev,
        complexityCharge: Number(settings.defaultComplexityCharge || '0'),
        markupCharge: Number(settings.defaultMarkupCharge || '0'),
      }));
    }
  }, [settings]);
  
  // Form handlers
  const setQuoteFormData = useCallback((data: Partial<QuoteFormData>) => {
    setQuoteFormDataState(prev => ({ ...prev, ...data }));
  }, []);
  
  const addTask = useCallback(() => {
    setTasks(prev => [...prev, { ...defaultTaskData, name: `Task ${prev.length + 1}` }]);
  }, []);
  
  const updateTask = useCallback((index: number, task: Partial<TaskFormData>) => {
    setTasks(prev => {
      const newTasks = [...prev];
      if (!newTasks[index]) return newTasks;
      
      // Ensure name is never undefined by using the existing name as fallback
      const updatedTask = {
        ...newTasks[index],
        ...task,
      };
      
      // Ensure required fields have values
      if (task.name === undefined) {
        updatedTask.name = newTasks[index].name;
      }
      
      newTasks[index] = updatedTask;
      return newTasks;
    });
  }, []);
  
  const removeTask = useCallback((index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const addMaterial = useCallback((taskIndex: number, material?: Partial<MaterialFormData>) => {
    setTasks(prev => {
      const newTasks = [...prev];
      if (!newTasks[taskIndex]) return newTasks;
      
      const defaultMaterial: MaterialFormData = {
        productId: '',
        name: `Material ${newTasks[taskIndex].materials.length + 1}`,
        unitPrice: 0,
        quantity: 1,
        notes: '',
      };
      
      newTasks[taskIndex].materials.push({ ...defaultMaterial, ...material });
      return newTasks;
    });
  }, []);
  
  const updateMaterial = useCallback((taskIndex: number, materialIndex: number, material: Partial<MaterialFormData>) => {
    setTasks(prev => {
      const newTasks = [...prev];
      if (!newTasks[taskIndex] || !newTasks[taskIndex].materials[materialIndex]) return newTasks;
      
      newTasks[taskIndex].materials[materialIndex] = {
        ...newTasks[taskIndex].materials[materialIndex],
        ...material
      };
      return newTasks;
    });
  }, []);
  
  const removeMaterial = useCallback((taskIndex: number, materialIndex: number) => {
    setTasks(prev => {
      const newTasks = [...prev];
      if (!newTasks[taskIndex]) return newTasks;
      
      newTasks[taskIndex].materials = newTasks[taskIndex].materials.filter(
        (_, i) => i !== materialIndex
      );
      return newTasks;
    });
  }, []);
  
  // Calculate totals
  const calculateTotals = useCallback((): QuoteTotals => {
    let subtotalTasks = 0;
    let subtotalMaterials = 0;
    
    // Calculate task and material subtotals
    tasks.forEach((task) => {
      subtotalTasks += parseFloat(task.price) * task.quantity;
      
      if (task.materialType === 'lumpsum') {
        subtotalMaterials += task.estimatedMaterialsCostLumpSum;
      } else if (task.materialType === 'itemized') {
        task.materials.forEach((material) => {
          subtotalMaterials += material.unitPrice * material.quantity;
        });
      }
    });
    
    const complexityCharge = quoteFormData.complexityCharge || 0;
    const markupCharge = quoteFormData.markupCharge || 0;
    const grandTotal = subtotalTasks + subtotalMaterials + complexityCharge + markupCharge;
    
    return {
      subtotalTasks,
      subtotalMaterials,
      complexityCharge,
      markupCharge,
      grandTotal,
    };
  }, [tasks, quoteFormData.complexityCharge, quoteFormData.markupCharge]);
  
  // Reset form
  const resetForm = useCallback(() => {
    setQuoteFormDataState(defaultQuoteFormData);
    setTasks([]);
  }, []);
  
  // Create quote
  const createQuote = useCallback(async (): Promise<string | undefined> => {
    if (!session?.user) {
      toast.error('You must be logged in to create a quote');
      return;
    }
    
    if (!quoteFormData.title || !quoteFormData.customerName) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (tasks.length === 0) {
      toast.error('Please add at least one task');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the quote
      const quoteResult = await createQuoteMutation.mutateAsync({
        title: quoteFormData.title,
        customerName: quoteFormData.customerName,
        customerEmail: quoteFormData.customerEmail || undefined,
        customerPhone: quoteFormData.customerPhone || undefined,
        notes: quoteFormData.notes || undefined,
        complexityCharge: quoteFormData.complexityCharge,
        markupCharge: quoteFormData.markupCharge,
      });
      
      if (!quoteResult || !quoteResult.id) {
        throw new Error('Failed to create quote');
      }
      
      // Create tasks for the quote
      for (const task of tasks) {
        const taskResult = await createTaskMutation.mutateAsync({
          quoteId: quoteResult.id,
          description: task.name,
          price: parseFloat(task.price),
          estimatedMaterialsCost:
            task.materialType === 'lumpsum'
              ? task.estimatedMaterialsCostLumpSum
              : task.materials.reduce(
                  (sum, material) => sum + material.unitPrice * material.quantity,
                  0
                ),
        });
        
        // Create materials for itemized tasks
        if (task.materialType === 'itemized' && task.materials.length > 0) {
          for (const material of task.materials) {
            try {
              if (!material.productId) continue;
              
              await createMaterialMutation.mutateAsync({
                taskId: taskResult.id,
                productId: material.productId,
                quantity: material.quantity || 1,
                unitPrice: material.unitPrice || 0,
                notes: material.notes || undefined,
              });
            } catch (materialError: any) {
              console.error('Error creating material:', materialError);
              toast.error(`Failed to create material: ${materialError.message || ''}`);
            }
          }
        }
      }
      
      // Invalidate queries to refresh UI
      utils.quote.getAll.invalidate();
      utils.quote.getById.invalidate({ id: quoteResult.id });
      
      toast.success('Quote created successfully');
      return quoteResult.id;
    } catch (error: any) {
      console.error('Error creating quote:', error);
      toast.error(`Failed to create quote: ${error.message || ''}`);
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  }, [quoteFormData, tasks, session, createQuoteMutation, createTaskMutation, createMaterialMutation, utils, toast]);
  
  // Update quote
  const updateQuote = useCallback(async (quoteId: string): Promise<boolean> => {
    if (!session?.user) {
      toast.error('You must be logged in to update a quote');
      return false;
    }
    
    if (!quoteFormData.title || !quoteFormData.customerName) {
      toast.error('Please fill in all required fields');
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      // Calculate totals
      const totals = calculateTotals();
      
      // Update the quote with new data
      await updateQuoteMutation.mutateAsync({
        id: quoteId,
        title: quoteFormData.title,
        customerName: quoteFormData.customerName,
        customerEmail: quoteFormData.customerEmail || undefined,
        customerPhone: quoteFormData.customerPhone || undefined,
        notes: quoteFormData.notes || undefined,
        subtotalTasks: totals.subtotalTasks.toString(),
        subtotalMaterials: totals.subtotalMaterials.toString(),
        complexityCharge: totals.complexityCharge.toString(),
        markupCharge: totals.markupCharge.toString(),
        grandTotal: totals.grandTotal.toString(),
      });
      
      // Invalidate queries to refresh UI
      utils.quote.getAll.invalidate();
      utils.quote.getById.invalidate({ id: quoteId });
      utils.task.getByQuoteId.invalidate({ quoteId });
      
      toast.success('Quote updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating quote:', error);
      toast.error(`Failed to update quote: ${error.message || ''}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [quoteFormData, calculateTotals, session, updateQuoteMutation, utils, toast]);
  
  // Delete quote
  const deleteQuote = useCallback(async (quoteId: string): Promise<boolean> => {
    if (!session?.user) {
      toast.error('You must be logged in to delete a quote');
      return false;
    }
    
    try {
      await deleteQuoteMutation.mutateAsync({ id: quoteId });
      
      // Invalidate the getAll query to refresh the UI
      utils.quote.getAll.invalidate();
      
      toast.success('Quote deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting quote:', error);
      toast.error(`Failed to delete quote: ${error.message || ''}`);
      return false;
    }
  }, [session, deleteQuoteMutation, utils, toast]);

  // Fetch quote by ID
  const fetchQuoteById = useCallback(async (quoteId: string) => {
    try {
      setLoading(true);
      resetForm();
      
      const quoteData = await utils.quote.getById.fetch({ id: quoteId });
      setCurrentQuote(quoteData);
      
      // Also update form data for potential editing
      if (quoteData) {
        setQuoteFormDataState({
          title: quoteData.title,
          customerName: quoteData.customerName,
          customerEmail: quoteData.customerEmail || '',
          customerPhone: quoteData.customerPhone || '',
          notes: quoteData.notes || '',
          complexityCharge: Number(quoteData.complexityCharge),
          markupCharge: Number(quoteData.markupCharge),
        });
        
        // Fetch tasks for the quote
        const tasksData = await utils.task.getByQuoteId.fetch({ quoteId });
        if (tasksData) {
          const formattedTasks = tasksData.map((task) => {
            // Create properly typed task data
            const formattedTask: TaskFormData = {
              id: task.id,
              name: task.description,
              description: task.description,
              price: String(task.price || '0'),
              quantity: 1, // Default to 1 if not available in API
              materialType: task.materials && task.materials.length > 0 ? 'itemized' : 'lumpsum',
              estimatedMaterialsCostLumpSum: Number(task.estimatedMaterialsCost || '0'),
              materials: [],
            };
            
            // Add materials if they exist
            if (task.materials && task.materials.length > 0) {
              formattedTask.materials = task.materials.map(material => ({
                id: material.id,
                productId: material.productId,
                name: 'Material', // Generic name
                unitPrice: Number(material.unitPrice || 0),
                quantity: material.quantity || 1,
                notes: material.notes || '',
              }));
            }
            
            return formattedTask;
          });
          
          setTasks(formattedTasks);
        }
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      toast.error("Failed to load quote details");
    } finally {
      setLoading(false);
    }
  }, [utils.quote.getById, utils.task.getByQuoteId, resetForm, toast]);
  
  // Update quote status
  const updateQuoteStatus = useCallback(async (quoteId: string, status: string) => {
    try {
      setIsSubmitting(true);
      
      if (!currentQuote) {
        toast.error("No quote data available");
        return false;
      }
      
      // Calculate totals
      const totals = calculateTotals();
      
      // Get uppercase status to match enum values
      const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const;
      const quoteStatus = validStatuses.includes(status.toUpperCase() as any) 
        ? status.toUpperCase() as 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'
        : 'DRAFT';
      
      await updateQuoteMutation.mutateAsync({
        id: quoteId,
        title: currentQuote.title,
        customerName: currentQuote.customerName,
        customerEmail: currentQuote.customerEmail || undefined,
        customerPhone: currentQuote.customerPhone || undefined,
        notes: currentQuote.notes || undefined,
        status: quoteStatus,
        // Include all required fields as strings
        subtotalTasks: currentQuote.subtotalTasks?.toString() || '0',
        subtotalMaterials: currentQuote.subtotalMaterials?.toString() || '0',
        complexityCharge: currentQuote.complexityCharge?.toString() || '0',
        markupCharge: currentQuote.markupCharge?.toString() || '0',
        grandTotal: currentQuote.grandTotal?.toString() || '0',
      });
      
      // Refetch the quote
      await fetchQuoteById(quoteId);
      
      toast.success(`Quote status updated to ${quoteStatus}`);
      return true;
    } catch (error) {
      console.error("Error updating quote status:", error);
      toast.error("Failed to update quote status");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentQuote, updateQuoteMutation, fetchQuoteById, calculateTotals, toast]);
  
  // Convert product data to the format we need
  const products = React.useMemo(() => {
    return productData?.items || [];
  }, [productData]);
  
  // Context value
  const value: QuotesContextType = {
    quoteFormData,
    tasks,
    products,
    currentQuote,
    loading,
    calculateTotals,
    setQuoteFormData,
    addTask,
    updateTask,
    removeTask,
    addMaterial,
    updateMaterial,
    removeMaterial,
    createQuote,
    updateQuote,
    deleteQuote,
    fetchQuoteById,
    updateQuoteStatus,
    isLoading,
    isSubmitting,
    resetForm,
  };
  
  return (
    <QuotesContext.Provider value={value}>
      {children}
    </QuotesContext.Provider>
  );
}

// Custom hook to use the quotes context
export function useQuotes() {
  const context = useContext(QuotesContext);
  if (context === undefined) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
} 