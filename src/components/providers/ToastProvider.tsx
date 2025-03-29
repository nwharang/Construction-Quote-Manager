'use client';

import { ToastProvider as HeroUIToastProvider, addToast } from '@heroui/toast';
import type { ReactNode } from 'react';

interface ToastProviderProps {
  children: ReactNode;
}

// Store for active toasts
interface ActiveToast {
  id: string;
  message: string;
  timestamp: number;
}

// Track active toasts
const activeToasts: ActiveToast[] = [];
const MAX_VISIBLE_TOASTS = 2;

// Helper to clean up old toasts
const cleanupOldToasts = () => {
  const now = Date.now();
  // Remove toasts older than 3 seconds
  const index = activeToasts.findIndex(toast => now - toast.timestamp > 3000);
  if (index !== -1) {
    activeToasts.splice(index, 1);
  }
};

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <HeroUIToastProvider
        toastProps={{
          classNames: {
            base: "bg-background border border-border",
            content: "flex gap-2 text-foreground",
            title: "text-sm font-medium",
            description: "text-xs",
            closeButton: "text-foreground"
          },
          timeout: 3000,
          variant: "bordered",
          hideIcon: false,
        }}
      />
    </>
  );
}

// Export a hook for using toasts throughout the app
export function useAppToast() {
  return {
    success: (message: string) => {
      // Manage active toasts to limit number displayed
      cleanupOldToasts();
      
      // Create a unique ID based on timestamp
      const id = `toast-${Date.now()}`;
      
      // Track this toast
      activeToasts.push({
        id,
        message,
        timestamp: Date.now()
      });
      
      // Limit visible toasts
      if (activeToasts.length > MAX_VISIBLE_TOASTS) {
        // We have too many toasts, only show the newest ones
        activeToasts.sort((a, b) => b.timestamp - a.timestamp);
        // Keep only the newest MAX_VISIBLE_TOASTS
        const toKeep = activeToasts.slice(0, MAX_VISIBLE_TOASTS);
        activeToasts.length = 0;
        activeToasts.push(...toKeep);
      }
      
      return addToast({
        title: "Success",
        description: message,
        variant: "bordered",
        color: "success",
      });
    },
    error: (message: string) => {
      // Check for duplicate error messages
      if (activeToasts.some(toast => toast.message === message)) {
        return null; // Prevent duplicate errors
      }
      
      cleanupOldToasts();
      
      // Create a unique ID based on timestamp
      const id = `toast-${Date.now()}`;
      
      // Track this toast
      activeToasts.push({
        id,
        message,
        timestamp: Date.now()
      });
      
      // Limit visible toasts
      if (activeToasts.length > MAX_VISIBLE_TOASTS) {
        // We have too many toasts, only show the newest ones
        activeToasts.sort((a, b) => b.timestamp - a.timestamp);
        // Keep only the newest MAX_VISIBLE_TOASTS
        const toKeep = activeToasts.slice(0, MAX_VISIBLE_TOASTS);
        activeToasts.length = 0;
        activeToasts.push(...toKeep);
      }
      
      return addToast({
        title: "Error",
        description: message,
        variant: "bordered",
        color: "danger",
        onClose: () => {
          // Remove from tracking when closed
          const index = activeToasts.findIndex(t => t.message === message);
          if (index !== -1) {
            activeToasts.splice(index, 1);
          }
        }
      });
    },
    loading: (message: string) => {
      cleanupOldToasts();
      
      return addToast({
        title: "Loading",
        description: message,
        variant: "bordered",
        color: "primary",
        timeout: 10000, // Longer timeout for loading toasts
      });
    }
  };
} 