/**
 * Type definitions for Quote-related data
 */

import type { Customer } from './customer';

export interface QuoteCustomer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface Material {
  id: string;
  taskId: string;
  productId?: string | null;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
}

export interface Task {
  id: string;
  quoteId: string;
  description: string;
  price: number;
  order: number;
  estimatedMaterialsCostLumpSum?: number;
  materialType: 'lumpsum' | 'itemized';
  materials: Material[];
}

/**
 * Base Quote interface
 */
export interface Quote {
  id: string;
  displayId: string;
  customerId: string;
  title: string;
  description?: string;
  status: QuoteStatus;
  total: number;
  taxRate?: number;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Extended Quote with Customer relationship
 */
export interface QuoteWithCustomer extends Quote {
  customer: Customer;
}

/**
 * Quote item (line item in a quote)
 */
export interface QuoteItem {
  id: string;
  quoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Quote status enum
 */
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

/**
 * Quote creation payload
 */
export interface QuoteCreateInput {
  customerId: string;
  title: string;
  description?: string;
  status?: QuoteStatus;
  taxRate?: number;
  validUntil?: string;
  items?: QuoteItemInput[];
}

/**
 * Quote update payload
 */
export interface QuoteUpdateInput {
  title?: string;
  description?: string;
  status?: QuoteStatus;
  taxRate?: number;
  validUntil?: string;
}

/**
 * Quote item input for creation/update
 */
export interface QuoteItemInput {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Response from quote list API
 */
export interface QuoteListResponse {
  quotes: Quote[];
  total: number;
  page: number;
  limit: number;
}

export interface QuoteProduct {
  id: string;
  sequentialId: number;
  name: string;
  description?: string | null;
  category: string;
  unitPrice: number;
  unit: string;
  sku?: string | null;
  manufacturer?: string | null;
  supplier?: string | null;
  location?: string | null;
  notes?: string | null;
}

/**
 * Product type alias for compatibility
 */
export type Product = QuoteProduct;

export interface QuoteTotals {
  subtotalTasks: number;
  subtotalMaterials: number;
  grandTotal: number;
}

/**
 * Data structure for the QuoteSummary component
 */
export interface QuoteSummaryData {
  subtotalTasks: number;
  subtotalMaterials: number;
  complexityCharge: number;
  complexityPercentage: number;
  markupCharge: number;
  markupPercentage: number;
  grandTotal: number;
}

/**
 * Form data structure for creating or updating a quote
 */
export interface QuoteFormData {
  id?: string;
  title: string;
  description?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  status?: QuoteStatus;
  validUntil?: string | Date;
  notes?: string;
  tasks: Task[];
  markupPercentage: number;
  complexityPercentage: number;
} 