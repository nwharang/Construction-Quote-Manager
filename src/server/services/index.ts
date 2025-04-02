import { TransactionService } from './transactionService';
import { QuoteService } from './quoteService';
import { DashboardService } from './dashboardService';
import { SettingsService } from './settingService';
import { db } from '../db';
import type { Session } from 'next-auth';

// Re-export types and error handling
export * from './types';

/**
 * Factory function to create service instances
 */
export function createServices(ctx: { session: Session | null }) {
  // The db instance is already correctly typed by Drizzle
  return {
    transaction: new TransactionService(db, ctx),
    quote: new QuoteService(db, ctx),
    dashboard: new DashboardService(db, ctx),
    settings: new SettingsService(db, ctx),
  };
}

// Export service classes
export { TransactionService, QuoteService, DashboardService, SettingsService };
