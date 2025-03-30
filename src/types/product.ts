/**
 * Product related types
 */

export interface Product {
  id: string;
  sequentialId: number;
  userId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
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

export interface ProductTableItem {
  id: string;
  sequentialId: number;
  displayId: string;
  name: string;
  category: string;
  unitPrice: number;
  unit: string;
} 