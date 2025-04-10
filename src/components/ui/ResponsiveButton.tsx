import React from 'react';
import { Button, cn } from '@heroui/react';
import type { ButtonProps } from '@heroui/react';

interface ResponsiveButtonProps extends ButtonProps {
  icon: React.ReactNode;
  label: string;
}

/**
 * A responsive button that shows only the icon on mobile screens
 * and both icon and text on larger screens
 */
export const ResponsiveButton = ({ icon, label, className, ...props }: ResponsiveButtonProps) => {
  return (
    <Button {...props} startContent={icon} className={cn(className)}>
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only">{label}</span>
    </Button>
  );
};
