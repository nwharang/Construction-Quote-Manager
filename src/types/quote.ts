export interface Product {
  id: string;
  name: string;
  unitPrice: number;
  description?: string;
  category?: string;
}

export interface Material {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Task {
  id: string;
  description: string;
  price: number;
  materialType: 'itemized' | 'lumpsum';
  estimatedMaterialsCostLumpSum: number;
  materials: Material[];
}

export interface QuoteFormData {
  title: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  complexityCharge: number;
  markupCharge: number;
}

export interface QuoteTotals {
  subtotalTasks: number;
  subtotalMaterials: number;
  complexityCharge: number;
  markupCharge: number;
  grandTotal: number;
} 