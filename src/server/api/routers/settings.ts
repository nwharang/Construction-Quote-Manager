import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { settings } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// Schema for updating settings
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

// Default settings configuration
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
      // 1. Get user ID from session
      const userId = ctx.session.user.id;
      
      // 2. Find user settings
      const userSettings = await ctx.db
        .select()
        .from(settings)
        .where(eq(settings.userId, userId))
        .limit(1);

      // 3. Create default settings if none exist
      if (!userSettings[0]) {
        // Create default settings if none exist
        const [newSettings] = await ctx.db
          .insert(settings)
          .values({
            userId: userId,
            ...defaultSettings,
          })
          .returning();

        // 4. Convert numeric string values to numbers for client consumption
        return processSettingsForClient(newSettings);
      }

      // 5. Convert numeric string values to numbers for client consumption
      return processSettingsForClient(userSettings[0]);
    } catch (error) {
      // 6. Handle errors
      console.error('Error fetching settings:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch settings',
        cause: error,
      });
    }
  }),

  update: protectedProcedure
    .input(updateSettingsInput)
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Get user ID from session
        const userId = ctx.session.user.id;
        
        // 2. Convert numeric values to strings for database storage
        const dataToUpdate = {
          ...input,
          defaultComplexityCharge: input.defaultComplexityCharge.toString(),
          defaultMarkupCharge: input.defaultMarkupCharge.toString(),
          defaultTaskPrice: input.defaultTaskPrice.toString(),
          defaultMaterialPrice: input.defaultMaterialPrice.toString(),
        };

        // 3. Update settings
        const [updatedSettings] = await ctx.db
          .update(settings)
          .set({
            ...dataToUpdate,
            updatedAt: new Date(),
          })
          .where(eq(settings.userId, userId))
          .returning();

        // 4. Verify update was successful
        if (!updatedSettings) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Settings not found',
          });
        }

        // 5. Convert numeric string values to numbers for client consumption
        return processSettingsForClient(updatedSettings);
      } catch (error) {
        // 6. Handle errors
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

/**
 * Helper function to convert string numeric values to actual numbers
 * for client consumption
 */
function processSettingsForClient(settingsData: any) {
  return {
    ...settingsData,
    defaultComplexityCharge: typeof settingsData.defaultComplexityCharge === 'string' 
      ? parseFloat(settingsData.defaultComplexityCharge) 
      : settingsData.defaultComplexityCharge,
    defaultMarkupCharge: typeof settingsData.defaultMarkupCharge === 'string' 
      ? parseFloat(settingsData.defaultMarkupCharge) 
      : settingsData.defaultMarkupCharge,
    defaultTaskPrice: typeof settingsData.defaultTaskPrice === 'string' 
      ? parseFloat(settingsData.defaultTaskPrice) 
      : settingsData.defaultTaskPrice,
    defaultMaterialPrice: typeof settingsData.defaultMaterialPrice === 'string' 
      ? parseFloat(settingsData.defaultMaterialPrice) 
      : settingsData.defaultMaterialPrice,
  };
}
