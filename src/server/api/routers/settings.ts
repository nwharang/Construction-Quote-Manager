import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { settings } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const updateSettingsInput = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyEmail: z.string().email('Invalid email address'),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  defaultComplexityCharge: z.number().min(0).max(100),
  defaultMarkupCharge: z.number().min(0).max(100),
  defaultTaskPrice: z.number().min(0),
  defaultMaterialPrice: z.number().min(0),
  emailNotifications: z.boolean(),
  quoteNotifications: z.boolean(),
  taskNotifications: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  locale: z.enum(['en', 'vi', 'es']),
  currency: z.string().min(1, 'Currency is required'),
  currencySymbol: z.string().min(1, 'Currency symbol is required'),
  dateFormat: z.string().min(1, 'Date format is required'),
  timeFormat: z.enum(['12h', '24h']),
});

// Default settings
const defaultSettings = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  defaultComplexityCharge: '0',
  defaultMarkupCharge: '0',
  defaultTaskPrice: '0',
  defaultMaterialPrice: '0',
  emailNotifications: true,
  quoteNotifications: true,
  taskNotifications: true,
  theme: 'system',
  locale: 'en',
  currency: 'USD',
  currencySymbol: '$',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
};

export const settingsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Use staleTime to cache the settings for 5 minutes (300000ms)
      // This is configured on the client side in utils/api.ts

      const userSettings = await ctx.db
        .select()
        .from(settings)
        .where(eq(settings.userId, ctx.session.user.id))
        .limit(1);

      if (!userSettings[0]) {
        // Create default settings if none exist
        const [newSettings] = await ctx.db
          .insert(settings)
          .values({
            userId: ctx.session.user.id,
            ...defaultSettings,
          })
          .returning();

        return newSettings;
      }

      return userSettings[0];
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch settings',
        cause: error,
      });
    }
  }),

  update: protectedProcedure.input(updateSettingsInput).mutation(async ({ ctx, input }) => {
    try {
      const [updatedSettings] = await ctx.db
        .update(settings)
        .set({
          ...input,
          defaultComplexityCharge: input.defaultComplexityCharge.toString(),
          defaultMarkupCharge: input.defaultMarkupCharge.toString(),
          defaultTaskPrice: input.defaultTaskPrice.toString(),
          defaultMaterialPrice: input.defaultMaterialPrice.toString(),
          updatedAt: new Date(),
        })
        .where(eq(settings.userId, ctx.session.user.id))
        .returning();

      if (!updatedSettings) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Settings not found',
        });
      }

      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update settings',
        cause: error,
      });
    }
  }),
});
