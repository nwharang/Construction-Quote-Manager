import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { customers, products, quotes } from '~/server/db/schema';
import { eq, and, sql, isNotNull } from 'drizzle-orm';

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure
    .input(
      z.object({
        timeRange: z.enum(['week', 'month', 'year', 'all']).optional().default('all'),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        // 1. Get user ID from session
        const userId = ctx.session.user.id;
        
        // 2. Determine date range based on input
        const timeRange = input?.timeRange || 'all';
        const dateFilter = getDateFilter(timeRange);

        // 3. Count total customers
        let customerCount;
        try {
          [customerCount] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(customers)
            .where(and(
              eq(customers.userId, userId),
              ...(dateFilter ? [sql`created_at > ${dateFilter.toISOString()}`] : [])
            ));
        } catch (err) {
          console.error('Error counting customers:', err);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get customer count',
            cause: err,
          });
        }

        // 4. Count total quotes
        let quoteCount;
        try {
          [quoteCount] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(quotes)
            .where(and(
              eq(quotes.userId, userId),
              ...(dateFilter ? [sql`created_at > ${dateFilter.toISOString()}`] : [])
            ));
        } catch (err) {
          console.error('Error counting quotes:', err);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get quote count',
            cause: err,
          });
        }

        // 5. Count total products
        let productCount;
        try {
          [productCount] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(and(
              eq(products.userId, userId),
              ...(dateFilter ? [sql`created_at > ${dateFilter.toISOString()}`] : [])
            ));
        } catch (err) {
          console.error('Error counting products:', err);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get product count',
            cause: err,
          });
        }

        // 6. Calculate total revenue from accepted quotes
        let revenueResult;
        try {
          [revenueResult] = await ctx.db
            .select({
              sum: sql<string>`COALESCE(sum(grand_total), 0)`,
            })
            .from(quotes)
            .where(
              and(
                eq(quotes.userId, userId),
                eq(quotes.status, 'ACCEPTED'),
                isNotNull(quotes.grandTotal),
                ...(dateFilter ? [sql`created_at > ${dateFilter.toISOString()}`] : [])
              )
            );
        } catch (err) {
          console.error('Error calculating revenue:', err);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to calculate revenue',
            cause: err,
          });
        }

        // 7. Get recent period data for growth calculation
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        // 8. Count customers created in the last month
        let lastMonthCustomers;
        try {
          [lastMonthCustomers] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(customers)
            .where(and(
              eq(customers.userId, userId), 
              sql`created_at > ${lastMonth.toISOString()}`
            ));
        } catch (err) {
          console.error('Error counting last month customers:', err);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get recent customer count',
            cause: err,
          });
        }

        // 9. Count quotes created in the last month
        let lastMonthQuotes;
        try {
          [lastMonthQuotes] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(quotes)
            .where(and(
              eq(quotes.userId, userId), 
              sql`created_at > ${lastMonth.toISOString()}`
            ));
        } catch (err) {
          console.error('Error counting last month quotes:', err);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get recent quote count',
            cause: err,
          });
        }

        // 10. Count products created in the last month
        let lastMonthProducts;
        try {
          [lastMonthProducts] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(and(
              eq(products.userId, userId), 
              sql`created_at > ${lastMonth.toISOString()}`
            ));
        } catch (err) {
          console.error('Error counting last month products:', err);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get recent product count',
            cause: err,
          });
        }

        // 11. Calculate growth percentages
        const totalCustomers = Number(customerCount?.count || 0);
        const totalQuotes = Number(quoteCount?.count || 0);
        const totalProducts = Number(productCount?.count || 0);
        const totalRevenue = Number(revenueResult?.sum || 0);

        const lastMonthCustomerCount = Number(lastMonthCustomers?.count || 0);
        const lastMonthQuoteCount = Number(lastMonthQuotes?.count || 0);
        const lastMonthProductCount = Number(lastMonthProducts?.count || 0);

        // 12. Calculate growth percentages
        const customerGrowth =
          totalCustomers > 0 ? Math.round((lastMonthCustomerCount / totalCustomers) * 100) : 0;

        const quoteGrowth =
          totalQuotes > 0 ? Math.round((lastMonthQuoteCount / totalQuotes) * 100) : 0;

        const productGrowth =
          totalProducts > 0 ? Math.round((lastMonthProductCount / totalProducts) * 100) : 0;

        // Revenue growth is not calculated in this example
        const revenueGrowth = 0;

        // 13. Return compiled statistics
        return {
          totalCustomers,
          totalQuotes,
          totalProducts,
          totalRevenue,
          customerGrowth,
          quoteGrowth,
          productGrowth,
          revenueGrowth,
        };
      } catch (error) {
        // 14. Handle unexpected errors
        console.error('Error fetching dashboard stats:', error);

        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch dashboard statistics',
          cause: error,
        });
      }
    }),
});

// Helper function to get date filter based on time range
function getDateFilter(timeRange: string): Date | null {
  const now = new Date();
  
  switch (timeRange) {
    case 'week': {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return oneWeekAgo;
    }
    case 'month': {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return oneMonthAgo;
    }
    case 'year': {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      return oneYearAgo;
    }
    case 'all':
    default:
      return null;
  }
}
