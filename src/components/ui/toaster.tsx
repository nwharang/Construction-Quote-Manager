'use client';

import { ToastProvider } from '@heroui/toast';

export function Toaster() {
  return (
    <ToastProvider
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
  );
} 