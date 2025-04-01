import { TransactionService } from './transactionService';
import { QuoteService } from './quoteService';
import { DashboardService } from './dashboardService';
import { db } from '../db';

/**
 * Common database interface used by all services
 * This matches the methods actually used across services
 */
export type DB = {
  select: any;
  insert: any;
  update: any;
  delete: any;
  transaction: any;
  from: any;
  leftJoin: any;
  where: any;
  groupBy: any;
  orderBy: any;
  limit: any;
  offset: any;
};

/**
 * Utility function to convert string numeric values to numbers
 * This ensures consistent handling of numeric data across all services
 */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
}

/**
 * Factory function to create service instances
 */
export function createServices() {
  return {
    transaction: new TransactionService(db as unknown as DB),
    quote: new QuoteService(db as unknown as DB),
    dashboard: new DashboardService(db as unknown as DB),
  };
}

// Export only services
export { TransactionService, QuoteService, DashboardService };
