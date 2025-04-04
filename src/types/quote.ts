// Basic quote types for the frontend
export interface QuoteListItem {
  id: string;
  sequentialId?: number;
  title: string;
  customerId: string;
  customerName?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  grandTotal: number;
  markupPercentage: number;
  notes?: string | null;
}

export interface QuotesListResponse {
  items: QuoteListItem[];
  totalPages: number;
  total: number;
  page: number;
} 