import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { createServices } from '~/server/services'; // Assume DashboardService is part of this

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure
    .input(
      z
        .object({
          timeRange: z.enum(['week', 'month', 'year', 'all']).optional().default('all'),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        // Delegate all logic to DashboardService
        const services = createServices(ctx);
        // Call service method without arguments
        const stats = await services.dashboard.getDashboardStats();
        return stats;
      } catch (error) {
        // Keep generic error handling
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

// Helper function removed - should be inside DashboardService
