import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { addToast } from '@heroui/toast';

interface ActiveToast {
  id: string;
  message: string;
  timestamp: number;
  type: 'success' | 'error' | 'loading';
}

interface ToastState {
  activeToasts: ActiveToast[];
  maxVisibleToasts: number;
  
  // Actions
  success: (message: string) => void;
  error: (message: string) => void;
  loading: (message: string) => void;
  removeToast: (id: string) => void;
  cleanupOldToasts: () => void;
}

export const useToastStore = create<ToastState>()(
  devtools(
    (set, get) => ({
      activeToasts: [],
      maxVisibleToasts: 2,
      
      success: (message: string) => {
        const { activeToasts, maxVisibleToasts } = get();
        
        // Check for duplicate success messages
        if (activeToasts.some(toast => toast.message === message && toast.type === 'success')) {
          return;
        }
        
        // Create a unique ID based on timestamp
        const id = `toast-${Date.now()}`;
        
        // Add toast to state
        set((state) => ({
          activeToasts: [
            ...state.activeToasts, 
            {
              id,
              message,
              timestamp: Date.now(),
              type: 'success'
            }
          ]
        }));
        
        // Manage visible toasts
        const updatedToasts = get().activeToasts;
        if (updatedToasts.length > maxVisibleToasts) {
          // We have too many toasts, only show the newest ones
          const sortedToasts = [...updatedToasts].sort((a, b) => b.timestamp - a.timestamp);
          // Keep only the newest maxVisibleToasts
          const toKeep = sortedToasts.slice(0, maxVisibleToasts);
          set({ activeToasts: toKeep });
        }
        
        // Show toast using @heroui/toast
        addToast({
          title: "Success",
          description: message,
          variant: "bordered",
          color: "success",
          onClose: () => {
            get().removeToast(id);
          }
        });
      },
      
      error: (message: string) => {
        const { activeToasts, maxVisibleToasts } = get();
        
        // Check for duplicate error messages
        if (activeToasts.some(toast => toast.message === message && toast.type === 'error')) {
          return;
        }
        
        // Create a unique ID based on timestamp
        const id = `toast-${Date.now()}`;
        
        // Add toast to state
        set((state) => ({
          activeToasts: [
            ...state.activeToasts, 
            {
              id,
              message,
              timestamp: Date.now(),
              type: 'error'
            }
          ]
        }));
        
        // Manage visible toasts
        const updatedToasts = get().activeToasts;
        if (updatedToasts.length > maxVisibleToasts) {
          // We have too many toasts, only show the newest ones
          const sortedToasts = [...updatedToasts].sort((a, b) => b.timestamp - a.timestamp);
          // Keep only the newest maxVisibleToasts
          const toKeep = sortedToasts.slice(0, maxVisibleToasts);
          set({ activeToasts: toKeep });
        }
        
        // Show toast using @heroui/toast
        addToast({
          title: "Error",
          description: message,
          variant: "bordered",
          color: "danger",
          onClose: () => {
            get().removeToast(id);
          }
        });
      },
      
      loading: (message: string) => {
        const { activeToasts, maxVisibleToasts } = get();
        
        // Check for duplicate loading messages
        if (activeToasts.some(toast => toast.message === message && toast.type === 'loading')) {
          return;
        }
        
        // Create a unique ID based on timestamp
        const id = `toast-${Date.now()}`;
        
        // Add toast to state
        set((state) => ({
          activeToasts: [
            ...state.activeToasts, 
            {
              id,
              message,
              timestamp: Date.now(),
              type: 'loading'
            }
          ]
        }));
        
        // Manage visible toasts
        const updatedToasts = get().activeToasts;
        if (updatedToasts.length > maxVisibleToasts) {
          // We have too many toasts, only show the newest ones
          const sortedToasts = [...updatedToasts].sort((a, b) => b.timestamp - a.timestamp);
          // Keep only the newest maxVisibleToasts
          const toKeep = sortedToasts.slice(0, maxVisibleToasts);
          set({ activeToasts: toKeep });
        }
        
        // Show toast using @heroui/toast
        addToast({
          title: "Loading",
          description: message,
          variant: "bordered",
          color: "primary",
          timeout: 10000, // Longer timeout for loading toasts
          onClose: () => {
            get().removeToast(id);
          }
        });
      },
      
      removeToast: (id: string) => {
        set((state) => ({
          activeToasts: state.activeToasts.filter(toast => toast.id !== id)
        }));
      },
      
      cleanupOldToasts: () => {
        const now = Date.now();
        set((state) => ({
          activeToasts: state.activeToasts.filter(toast => now - toast.timestamp <= 3000)
        }));
      }
    })
  )
); 