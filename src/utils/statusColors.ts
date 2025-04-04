import type { QuoteStatusType } from '~/server/db/schema';

/**
 * Returns the appropriate color for a quote status
 */
export function getStatusColor(status: QuoteStatusType): 'default' | 'primary' | 'success' | 'danger' | 'warning' {
  switch (status) {
    case 'DRAFT':
      return 'default';
    case 'SENT':
      return 'primary';
    case 'ACCEPTED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    default:
      return 'warning';
  }
} 