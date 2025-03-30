import React from 'react';
import { ToastProvider as HeroUIToastProvider } from '@heroui/toast';
import { useToastStore } from '~/store';

/**
 * Toast container that uses HeroUI's ToastProvider
 * This is a small wrapper component that ensures toast notifications
 * have consistent styling and behavior
 */
export function ToastContainer() {
  return (
    <HeroUIToastProvider
      toastProps={{
        classNames: {
          base: "bg-background/95 backdrop-blur border border-border shadow-md",
          content: "flex gap-2 text-foreground",
          title: "text-sm font-medium",
          description: "text-xs",
          closeButton: "text-foreground"
        },
        timeout: 3000,
        variant: "solid",
        hideIcon: false,
      }}
    />
  );
} 