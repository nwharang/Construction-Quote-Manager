import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { customers, products, quotes } from '~/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      try {
        // Count total customers
        const [customerCount] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(customers)
          .where(eq(customers.userId, userId));

        // Count total quotes
        const [quoteCount] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(quotes)
          .where(eq(quotes.userId, userId));
          
        // Count total products
        const [productCount] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(eq(products.userId, userId));
          
        // Calculate total revenue from accepted quotes
        const [revenueResult] = await ctx.db
          .select({
            sum: sql<string>`sum(grand_total)`
          })
          .from(quotes)
          .where(
            and(
              eq(quotes.userId, userId),
              eq(quotes.status, 'ACCEPTED')
            )
          );
          
        // Count customers created in the last month
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const [lastMonthCustomers] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(customers)
          .where(
            and(
              eq(customers.userId, userId),
              sql`created_at > ${lastMonth.toISOString()}`
            )
          );
          
        // Count quotes created in the last month
        const [lastMonthQuotes] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(quotes)
          .where(
            and(
              eq(quotes.userId, userId),
              sql`created_at > ${lastMonth.toISOString()}`
            )
          );
          
        // Count products created in the last month
        const [lastMonthProducts] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(
            and(
              eq(products.userId, userId),
              sql`created_at > ${lastMonth.toISOString()}`
            )
          );
          
        // Calculate growth percentages
        const totalCustomers = Number(customerCount?.count || 0);
        const totalQuotes = Number(quoteCount?.count || 0);
        const totalProducts = Number(productCount?.count || 0);
        const totalRevenue = Number(revenueResult?.sum || 0);
        
        const lastMonthCustomerCount = Number(lastMonthCustomers?.count || 0);
        const lastMonthQuoteCount = Number(lastMonthQuotes?.count || 0);
        const lastMonthProductCount = Number(lastMonthProducts?.count || 0);
        
        // Calculate growth percentages (avoid division by zero)
        const customerGrowth = totalCustomers > 0
          ? Math.round((lastMonthCustomerCount / totalCustomers) * 100)
          : 0;
          
        const quoteGrowth = totalQuotes > 0
          ? Math.round((lastMonthQuoteCount / totalQuotes) * 100)
          : 0;
          
        const productGrowth = totalProducts > 0
          ? Math.round((lastMonthProductCount / totalProducts) * 100)
          : 0;
          
        // Revenue growth is not calculated in this example
        const revenueGrowth = 0;
        
        return {
          totalCustomers,
          totalQuotes,
          totalProducts,
          totalRevenue,
          customerGrowth,
          quoteGrowth,
          productGrowth,
          revenueGrowth
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw new Error('Failed to fetch dashboard statistics');
      }
    })
}); 