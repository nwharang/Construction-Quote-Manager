/**
 * Centralized type exports for the application
 */

// Export all types from their respective files directly
export * from './quote';
export * from './settings';
export * from './auth';  // Uncomment when file is created
export * from './ui';    // Uncomment when file is created
export * from './api';

// Re-export types with explicit naming to avoid conflicts
export { type Customer } from './customer';
export { type Product } from './product';
export { 
  type CommonApiResponse as ApiResponseLegacy,
  type CommonApiError as ApiErrorLegacy,
  type Pagination,
  type SelectOption,
  type UserFriendlyId,
  type DateRange,
  type SortDirection,
  type SortOption
} from './common'; 