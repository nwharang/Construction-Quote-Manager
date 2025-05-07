import { type DB } from './types';
import { type Session } from 'next-auth';
import { BaseService } from './baseService';
import { eq } from 'drizzle-orm';
import { settings } from '../db/schema';
import { TRPCError, type inferRouterInputs } from '@trpc/server';
import { DEFAULT_LOCALE } from '~/i18n/locales';
import { type AppRouter } from '~/server/api/root'; // Adjust path if needed

// --- Types moved from settingsMethods.ts ---
export type SelectSetting = typeof settings.$inferSelect;
export type ClientSettingsData = Omit<SelectSetting, never>;
type InsertSetting = typeof settings.$inferInsert;
type UpdateSettingsInputType = inferRouterInputs<AppRouter>['settings']['update'];
// --- End moved types ---

/**
 * Service layer for handling application settings logic
 */
export class SettingsService extends BaseService {
  constructor(db: DB, ctx: { session: Session | null }) {
    super(db, ctx);
  }

  // --- Methods moved from settingsMethods.ts ---

  /**
   * Retrieves settings for a given user ID.
   * If no settings exist, default settings are created and returned.
   */
  public async getOrCreateSettings({ userId }: { userId: string }): Promise<ClientSettingsData> {
    if (!userId) {
      console.error('getOrCreateSettings called without a userId.');
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'User ID is required.' });
    }

    const existingSettings = await this.db.query.settings.findFirst({
      where: eq(settings.userId, userId),
    });

    if (existingSettings) {
      return existingSettings;
    }

    return this.createAndReturnDefaultSettings({ userId });
  }

  /**
   * Update settings for a user.
   * Input data should match the structure expected by the frontend/Zod schema.
   */
  public async updateSettings({
    userId,
    data,
  }: {
    userId: string;
    data: UpdateSettingsInputType;
  }): Promise<ClientSettingsData> {
    if (!userId) {
      console.error('updateSettings called without a valid user ID.');
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'User ID is required.' });
    }

    // Prepare data for the database update
    const dataToUpdate: Partial<Omit<InsertSetting, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> =
      {
        companyName: data.companyName,
        companyEmail: data.companyEmail,
        companyPhone: data.companyPhone,
        companyAddress: data.companyAddress,
      };

    // Remove properties that are explicitly undefined in the input
    Object.keys(dataToUpdate).forEach((keyStr) => {
      const key = keyStr as keyof typeof dataToUpdate;
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });

    try {
      const [updatedSetting] = await this.db
        .update(settings)
        .set({
          ...dataToUpdate,
          updatedAt: new Date(),
        })
        .where(eq(settings.userId, userId))
        .returning();

      if (!updatedSetting) {
        console.error(
          `Failed to update settings for user ${userId}. Settings might not exist or another error occurred.`
        );
        const existing = await this.db.query.settings.findFirst({
          where: eq(settings.userId, userId),
        });
        if (!existing) {
          const createdDefaults = await this.createAndReturnDefaultSettings({ userId });
          return createdDefaults;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to apply settings update.',
        });
      }

      return updatedSetting;
    } catch (error) {
      console.error(`Error updating settings for user ${userId}:`, error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not update settings.',
        cause: error,
      });
    }
  }

  /**
   * Internal helper to create and insert default settings for a user ID.
   * @private
   */
  private async createAndReturnDefaultSettings({
    userId,
  }: {
    userId: string;
  }): Promise<ClientSettingsData> {
    const defaultSettingsData: Omit<InsertSetting, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: userId,
      companyName: null,
      companyEmail: null,
      companyPhone: null,
      companyAddress: null,
      emailNotifications: true,
      quoteNotifications: true,
      taskNotifications: true,
      theme: 'system',
      locale: DEFAULT_LOCALE,
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
    };

    try {
      const [newSettings] = await this.db.insert(settings).values(defaultSettingsData).returning();
      if (!newSettings) {
        throw new Error('Failed to retrieve settings immediately after creation.');
      }
      return newSettings;
    } catch (error) {
      console.error(`Error creating default settings for user ${userId}:`, error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not create default settings.',
        cause: error,
      });
    }
  }
}
