import { v4 as uuidv4 } from 'uuid';
import type { Task, Material, Quote } from '~/types/quote';
import type { QuoteFormData } from '~/hooks/useQuoteCalculator';

/**
 * Create a new empty task with default values
 * @param quoteId The ID of the quote this task belongs to
 * @param order Optional order position for the task
 * @returns A new task object with default values
 */
export const createEmptyTask = (quoteId: string, order = 0): Task => {
  return {
    id: uuidv4(),
    quoteId,
    description: '',
    price: 0,
    order,
    materialType: 'lumpsum',
    estimatedMaterialsCostLumpSum: 0,
    materials: [],
  };
};

/**
 * Create a new empty material with default values
 * @param taskId The ID of the task this material belongs to
 * @returns A new material object with default values
 */
export const createEmptyMaterial = (taskId: string): Material => {
  return {
    id: uuidv4(),
    taskId,
    name: '',
    quantity: 1,
    unitPrice: 0,
    description: '',
    productId: null,
    notes: null,
  };
};

/**
 * Create a new empty quote form data with default values
 * @returns A new quote form data object with default values
 */
export const createEmptyQuoteForm = (): QuoteFormData => {
  const quoteId = uuidv4();

  return {
    id: quoteId,
    title: 'New Quote',
    customerId: undefined,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
    tasks: [createEmptyTask(quoteId)],
    complexityPercentage: 0,
    markupPercentage: 0,
    taxRate: 0,
    status: 'DRAFT',
  };
};

/**
 * Convert a Quote object to a QuoteFormData object for editing
 * @param quote The quote object to convert
 * @returns A QuoteFormData object for the form
 */
export const quoteToFormData = (quote: Quote & { customer?: any }): QuoteFormData => {
  // This function converts a database quote object to a form-compatible object
  return {
    id: quote.id,
    title: quote.title,
    customerId: quote.customerId || undefined,
    customerName: quote.customer?.name || '',
    customerEmail: quote.customer?.email || '',
    customerPhone: quote.customer?.phone || '',
    customerAddress: quote.customer?.address || '',
    status: quote.status,
    validUntil: quote.validUntil ? new Date(quote.validUntil) : undefined,
    notes: quote.description || '',
    tasks: [], // Initialize with empty, will be loaded separately
    markupPercentage: 0,
    complexityPercentage: 0,
    taxRate: quote.taxRate || 0,
  };
};

/**
 * Generate a unique sequential ID for display purposes
 * @param existingIds Array of existing sequential IDs
 * @returns A new sequential ID
 */
export const generateSequentialId = (existingIds: number[] = []): number => {
  if (existingIds.length === 0) {
    return 1;
  }

  const maxId = Math.max(...existingIds);
  return maxId + 1;
};

/**
 * Format a quote status for display
 * @param status The quote status
 * @returns A formatted status string
 */
export const formatQuoteStatus = (status: Quote['status']): string => {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'SENT':
      return 'Sent';
    case 'ACCEPTED':
      return 'Accepted';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Unknown';
  }
};
