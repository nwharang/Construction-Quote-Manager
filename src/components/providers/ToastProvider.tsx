import { Toaster, toast } from 'react-hot-toast';
import type { ReactNode } from 'react';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

// Export a hook for using toasts throughout the app
export function useAppToast() {
  return {
    success: (message: string) => {
      toast.success(message);
    },
    error: (message: string) => {
      toast.error(message);
    },
    loading: (message: string) => {
      toast.loading(message);
    },
  };
} 