/**
 * Common types used across the application
 */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface CommonApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface CommonApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface SelectOption {
  label: string;
  value: string | number | boolean;
}

export interface UserFriendlyId {
  id: string;
  sequentialId: number;
  displayId: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: string;
  direction: SortDirection;
} 