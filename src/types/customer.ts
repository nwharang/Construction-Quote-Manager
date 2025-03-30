/**
 * Customer related types
 */

import type { Quote } from './quote';

/**
 * Type definitions for Customer-related data
 */

/**
 * Base Customer interface
 */
export interface Customer {
  id: string;
  sequentialId: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  notes?: string | null;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Extended Customer with Quotes relationship
 */
export interface CustomerWithQuotes extends Customer {
  displayId: string; // Required in this context
  quotes: Quote[];
  totalQuotes: number;
  totalValue: number;
}

/**
 * Customer creation payload
 */
export interface CustomerCreateInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  notes?: string | null;
  website?: string | null;
}

/**
 * Customer update payload
 */
export interface CustomerUpdateInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  notes?: string | null;
  website?: string | null;
}

/**
 * Response from customer list API
 */
export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerList {
  customers: CustomerWithQuotes[];
  total: number;
}

export interface CustomerFormData {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface CustomerTableItem {
  id: string;
  sequentialId: number;
  displayId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  quoteCount: number;
} 