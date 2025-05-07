import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { SettingsService } from '~/server/services/settingService';

// Export the inferred type for client-side usage

export const settingsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    try {
      // 1. Get user ID from session
      const userId = ctx.session.user.id;

      // 2. Instantiate the service
      const service = new SettingsService(ctx.db, ctx);

      // 3. Delegate fetching/creation entirely to the service
      const userSettings = await service.getOrCreateSettings({ userId });

      // 4. Return the result directly (service handles processing)
      return userSettings;
    } catch (error) {
      // 5. Handle errors (keep generic error handling)
      console.error('Error in settings.get procedure:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch settings',
        cause: error,
      });
    }
  }),

  update: protectedProcedure
    .input(
      z.object({
        companyName: z.string().nullish(),
        companyEmail: z.string().email('Invalid email address').nullish(),
        companyPhone: z.string().nullish(),
        companyAddress: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Get user ID from session
        const userId = ctx.session.user.id;

        // 2. Instantiate the service
        const service = new SettingsService(ctx.db, ctx);

        // 3. Delegate update entirely to the service
        // The service method now handles data conversion if necessary
        const updatedSettings = await service.updateSettings({
          userId,
          data: input, // Pass the Zod-validated input directly
        });

        // 4. Return the result from the service
        return updatedSettings;
      } catch (error) {
        // 5. Handle errors (keep generic error handling)
        console.error('Error in settings.update procedure:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update settings',
          cause: error,
        });
      }
    }),
});
