import { TRPCError } from '@trpc/server';
import { sql, eq, desc } from 'drizzle-orm';
import { quotes, customers } from '../db/schema';
import { type DB } from './index';
import { BaseService } from './baseService';
import type { Session } from 'next-auth';

/**
 * Service layer for handling dashboard-related business logic
 */
export class DashboardService extends BaseService {
  constructor(db: DB, ctx: { session: Session | null }) {
    super(db, ctx);
  }

  /**
   * Get dashboard statistics for quotes
   * Reads are not user-scoped per CONTEXT.md
   */
  async getDashboardStats(/* userId: string */) {
    try {
      // Get all stats in a single query
      const stats = await this.db
        .select({
          totalQuotes: sql<number>`count(*)`,
          acceptedQuotes: sql<number>`count(*) filter (where ${quotes.status} = 'ACCEPTED')`,
          totalCustomers: sql<number>`count(distinct ${quotes.customerId})`,
          totalRevenue: sql<string>`coalesce(sum(cast(${quotes.grandTotal} as numeric)) filter (where ${quotes.status} = 'ACCEPTED'), '0')`,
        })
        .from(quotes);

      // Get recent quotes with customer information
      const recentQuotes = await this.db
        .select({
          quote: quotes,
          customer: customers,
        })
        .from(quotes)
        .leftJoin(customers, eq(quotes.customerId, customers.id))
        .orderBy(desc(quotes.createdAt))
        .limit(5);

      // Get top customers by revenue
      const topCustomers = await this.db
        .select({
          customer: customers,
          totalRevenue: sql<string>`coalesce(sum(cast(${quotes.grandTotal} as numeric)) filter (where ${quotes.status} = 'ACCEPTED'), '0')`,
          quoteCount: sql<number>`count(*)`,
        })
        .from(quotes)
        .leftJoin(customers, eq(quotes.customerId, customers.id))
        .groupBy(customers.id, customers.name, customers.email, customers.phone)
        .orderBy(
          sql`sum(cast(${quotes.grandTotal} as numeric)) filter (where ${quotes.status} = 'ACCEPTED') desc`
        )
        .limit(5);

      if (!stats[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch dashboard stats',
        });
      }

      // Process quotes to convert string numeric values to numbers
      const processedRecentQuotes = recentQuotes.map(({ quote, customer }) => ({
        ...quote,
        customer: customer || null,
        subtotalTasks: this.toNumber(quote.subtotalTasks),
        subtotalMaterials: this.toNumber(quote.subtotalMaterials),
        complexityCharge: this.toNumber(quote.complexityCharge),
        markupCharge: this.toNumber(quote.markupCharge),
        markupPercentage: this.toNumber(quote.markupPercentage),
        grandTotal: this.toNumber(quote.grandTotal),
      }));

      // Process top customers to convert string numeric values to numbers
      const processedTopCustomers = topCustomers.map(({ customer, totalRevenue, quoteCount }) => ({
        ...customer,
        totalRevenue: this.toNumber(totalRevenue),
        quoteCount: this.toNumber(quoteCount || 0),
      }));

      return {
        totalQuotes: this.toNumber(stats[0].totalQuotes || 0),
        acceptedQuotes: this.toNumber(stats[0].acceptedQuotes || 0),
        totalCustomers: this.toNumber(stats[0].totalCustomers || 0),
        totalRevenue: this.toNumber(stats[0].totalRevenue),
        recentQuotes: processedRecentQuotes,
        topCustomers: processedTopCustomers,
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch dashboard stats',
        cause: error,
      });
    }
  }
}
