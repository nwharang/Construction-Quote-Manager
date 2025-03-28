import { useToast } from '@heroui/react';
import type { ReactNode } from 'react';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return <>{children}</>;
}

// Export a hook for using toasts throughout the app
export function useAppToast() {
  const toast = useToast();

  return {
    success: (message: string) => {
      toast({
        title: 'Success',
        description: message,
        variant: 'success',
        duration: 3000,
      });
    },
    error: (message: string) => {
      toast({
        title: 'Error',
        description: message,
        variant: 'danger',
        duration: 5000,
      });
    },
    loading: (message: string) => {
      toast({
        title: 'Loading',
        description: message,
        variant: 'default',
        duration: 2000,
      });
    },
  };
} 