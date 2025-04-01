import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;
type QuoteFormData = RouterInput['quote']['create'];
type TaskFormData = NonNullable<QuoteFormData['tasks']>[number];
type MaterialFormData = NonNullable<TaskFormData['materials']>[number];

interface QuoteState {
  // Quote Form State
  formData: QuoteFormData;
  isSubmitting: boolean;
  error: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
  history: QuoteFormData[];
  historyIndex: number;

  // Actions
  setFormData: (data: QuoteFormData) => void;
  updateField: (field: keyof QuoteFormData, value: any) => void;
  addTask: () => void;
  removeTask: (index: number) => void;
  updateTask: (index: number, task: TaskFormData) => void;
  addMaterial: (taskIndex: number) => void;
  removeMaterial: (taskIndex: number, materialIndex: number) => void;
  updateMaterial: (taskIndex: number, materialIndex: number, material: MaterialFormData) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  resetForm: () => void;

  // New Actions
  validateForm: () => boolean;
  undo: () => void;
  redo: () => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const STORAGE_KEY = 'quote-form-data';

const initialState: QuoteFormData = {
  title: '',
  customerId: '',
  notes: '',
  validityDate: null,
  tasks: [],
  complexityCharge: 0,
  markupCharge: 0,
};

export const useQuoteStore = create<QuoteState>()(
  devtools(
    (set, get) => ({
      formData: initialState,
      isSubmitting: false,
      error: null,
      isDirty: false,
      lastSaved: null,
      history: [initialState],
      historyIndex: 0,

      setFormData: (data) => {
        set((state) => ({
          formData: data,
          history: [...state.history.slice(0, state.historyIndex + 1), data],
          historyIndex: state.historyIndex + 1,
          isDirty: true,
        }));
      },

      updateField: (field, value) => {
        set((state) => {
          const newFormData = { ...state.formData, [field]: value };
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newFormData];
          return {
            formData: newFormData,
            isDirty: true,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      addTask: () => {
        set((state) => {
          const newTask = {
            description: '',
            price: 0,
            materials: [],
          };
          const newTasks = [...state.formData.tasks, newTask];
          const newFormData = { ...state.formData, tasks: newTasks };
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newFormData];
          return {
            formData: newFormData,
            isDirty: true,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      removeTask: (index) => {
        set((state) => {
          const newTasks = state.formData.tasks.filter((_, i) => i !== index);
          const newFormData = { ...state.formData, tasks: newTasks };
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newFormData];
          return {
            formData: newFormData,
            isDirty: true,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      updateTask: (index, task) => {
        set((state) => {
          const newTasks = [...state.formData.tasks];
          newTasks[index] = task;
          const newFormData = { ...state.formData, tasks: newTasks };
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newFormData];
          return {
            formData: newFormData,
            isDirty: true,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      addMaterial: (taskIndex) => {
        set((state) => {
          const newTasks = state.formData.tasks.map((task, index) => {
            if (index === taskIndex) {
              return {
                ...task,
                materials: [
                  ...(task.materials || []),
                  { name: '', quantity: 1, unitPrice: 0, notes: '' },
                ],
              };
            }
            return task;
          });
          const newFormData = { ...state.formData, tasks: newTasks };
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newFormData];
          return {
            formData: newFormData,
            isDirty: true,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      removeMaterial: (taskIndex, materialIndex) => {
        set((state) => {
          const newTasks = state.formData.tasks.map((task, index) => {
            if (index === taskIndex) {
              return {
                ...task,
                materials: (task.materials || []).filter((_, i) => i !== materialIndex),
              };
            }
            return task;
          });
          const newFormData = { ...state.formData, tasks: newTasks };
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newFormData];
          return {
            formData: newFormData,
            isDirty: true,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      updateMaterial: (taskIndex, materialIndex, material) => {
        set((state) => {
          const newTasks = state.formData.tasks.map((task, index) => {
            if (index === taskIndex) {
              const materials = [...(task.materials || [])];
              materials[materialIndex] = material;
              return { ...task, materials };
            }
            return task;
          });
          const newFormData = { ...state.formData, tasks: newTasks };
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newFormData];
          return {
            formData: newFormData,
            isDirty: true,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      setError: (error) => set({ error }),

      resetForm: () => set({ formData: initialState, isDirty: false, error: null }),

      // New Actions
      validateForm: () => {
        const { formData } = get();
        return formData.title.length > 0 && formData.customerId.length > 0;
      },

      undo: () => {
        set((state) => {
          if (state.historyIndex > 0) {
            return {
              formData: state.history[state.historyIndex - 1],
              historyIndex: state.historyIndex - 1,
            };
          }
          return state;
        });
      },

      redo: () => {
        set((state) => {
          if (state.historyIndex < state.history.length - 1) {
            return {
              formData: state.history[state.historyIndex + 1],
              historyIndex: state.historyIndex + 1,
            };
          }
          return state;
        });
      },

      saveToLocalStorage: () => {
        const { formData } = get();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        set({ lastSaved: new Date() });
      },

      loadFromLocalStorage: () => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            set({ formData: parsedData });
          } catch (error) {
            console.error('Failed to load saved form data:', error);
          }
        }
      },
    }),
    {
      name: 'quote-store',
    }
  )
);
