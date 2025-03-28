import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { settings } from '~/server/db/schema';
import { eq } from 'drizzle-orm';

const settingsInput = z.object({
  currency: z.string().min(1, 'Currency is required'),
  locale: z.string().min(1, 'Locale is required'),
  dateFormat: z.string().min(1, 'Date format is required'),
  timeFormat: z.string().min(1, 'Time format is required'),
});

export const settingsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
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
        })
        .returning();

      return newSettings;
    }

    return userSettings[0];
  }),

  update: protectedProcedure
    .input(settingsInput)
    .mutation(async ({ ctx, input }) => {
      const existingSettings = await ctx.db
        .select()
        .from(settings)
        .where(eq(settings.userId, ctx.session.user.id))
        .limit(1);

      if (!existingSettings[0]) {
        // Create new settings if none exist
        const [newSettings] = await ctx.db
          .insert(settings)
          .values({
            ...input,
            userId: ctx.session.user.id,
          })
          .returning();

        return newSettings;
      }

      // Update existing settings
      const [updatedSettings] = await ctx.db
        .update(settings)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(settings.userId, ctx.session.user.id))
        .returning();

      return updatedSettings;
    }),
}); 