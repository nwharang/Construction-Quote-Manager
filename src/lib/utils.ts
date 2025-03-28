import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge class names with tailwind classes
 * This is commonly used in UI components to handle class name combinations
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 