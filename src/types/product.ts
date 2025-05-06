export interface Product {
  id: string;
  name: string;
  description: string | null;
  unitPrice: string;
  sku: string | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  category: string | null;
} 