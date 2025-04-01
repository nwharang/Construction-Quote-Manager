import { TRPCError } from '@trpc/server';
import { sql, eq, desc } from 'drizzle-orm';
import { quotes, customers, type QuoteStatusType } from '../db/schema';
import { type DB, toNumber } from './index';

/**
 * Service layer for handling dashboard-related business logic
 */
export class DashboardService {
  constructor(private db: DB) {}

  /**
   * Get dashboard statistics for quotes
   */
  async getDashboardStats(userId: string) {
    try {
      // Get all stats in a single query
      const stats = await this.db
        .select({
          totalQuotes: sql<number>`count(*)`,
          acceptedQuotes: sql<number>`count(*) filter (where ${quotes.status} = 'ACCEPTED')`,
          totalCustomers: sql<number>`count(distinct ${quotes.customerId})`,
          totalRevenue: sql<string>`coalesce(sum(cast(${quotes.grandTotal} as numeric)) filter (where ${quotes.status} = 'ACCEPTED'), '0')`,
        })
        .from(quotes)
        .where(eq(quotes.userId, userId));

      // Get recent quotes with customer information
      const recentQuotes = await this.db
        .select({
          quote: quotes,
          customer: customers,
        })
        .from(quotes)
        .leftJoin(customers, eq(quotes.customerId, customers.id))
        .where(eq(quotes.userId, userId))
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
        .where(eq(quotes.userId, userId))
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
      const processedRecentQuotes = recentQuotes.map(({ quote, customer }: { quote: any; customer: any }) => ({
        ...quote,
        customer: customer || null,
        subtotalTasks: toNumber(quote.subtotalTasks),
        subtotalMaterials: toNumber(quote.subtotalMaterials),
        complexityCharge: toNumber(quote.complexityCharge),
        markupCharge: toNumber(quote.markupCharge),
        markupPercentage: toNumber(quote.markupPercentage),
        grandTotal: toNumber(quote.grandTotal),
      }));

      // Process top customers to convert string numeric values to numbers
      const processedTopCustomers = topCustomers.map(({ customer, totalRevenue, quoteCount }: { customer: any; totalRevenue: string; quoteCount: number }) => ({
        ...customer,
        totalRevenue: toNumber(totalRevenue),
        quoteCount: Number(quoteCount || 0),
      }));

      return {
        totalQuotes: Number(stats[0].totalQuotes || 0),
        acceptedQuotes: Number(stats[0].acceptedQuotes || 0),
        totalCustomers: Number(stats[0].totalCustomers || 0),
        totalRevenue: toNumber(stats[0].totalRevenue),
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