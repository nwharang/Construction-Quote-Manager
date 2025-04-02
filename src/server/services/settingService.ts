import { type DB } from './types';
import { type Session } from 'next-auth';
import { BaseService } from './baseService';
import { eq } from 'drizzle-orm';
import { settings } from '../db/schema';
import { TRPCError, type inferRouterInputs } from '@trpc/server';
import {
  DEFAULT_LOCALE,
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_MARKUP_PERCENTAGE,
  DEFAULT_COMPLEXITY_CHARGE,
  DEFAULT_TASK_PRICE,
  DEFAULT_MATERIAL_PRICE,
} from '~/config/constants';
import { type AppRouter } from '~/server/api/root'; // Adjust path if needed

// --- Types moved from settingsMethods.ts ---
export type SelectSetting = typeof settings.$inferSelect;
export type ClientSettingsData = Omit<
  SelectSetting,
  'defaultComplexityCharge' | 'defaultMarkupCharge' | 'defaultTaskPrice' | 'defaultMaterialPrice'
> & {
  defaultComplexityCharge: number;
  defaultMarkupCharge: number;
  defaultTaskPrice: number;
  defaultMaterialPrice: number;
};
type InsertSetting = typeof settings.$inferInsert;
type UpdateSettingsInputType = inferRouterInputs<AppRouter>['settings']['update'];
// --- End moved types ---

/**
 * Service layer for handling application settings logic
 */
export class SettingsService extends BaseService {
  constructor(db: DB, ctx: { session: Session | null }) {
    super(db, ctx);
    // Removed binding logic
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
      return this.processSettingsForClient(existingSettings);
    }

    console.log(`No settings found for user ${userId}, creating defaults.`);
    return this.createAndReturnDefaultSettings({ userId });
  }

  /**
   * Update settings for a user.
   * Input data should match the structure expected by the frontend/Zod schema (e.g., numbers).
   * This method handles converting numbers back to strings for DB storage.
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

    const dataToUpdate: Partial<Omit<InsertSetting, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> =
      {
        // Copy non-numeric fields directly
        companyName: data.companyName,
        companyEmail: data.companyEmail,
        companyPhone: data.companyPhone,
        companyAddress: data.companyAddress,
        emailNotifications: data.emailNotifications,
        quoteNotifications: data.quoteNotifications,
        taskNotifications: data.taskNotifications,
        theme: data.theme,
        locale: data.locale,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        // Convert numeric fields to strings
        ...(data.defaultComplexityCharge !== undefined && {
          defaultComplexityCharge: String(data.defaultComplexityCharge),
        }),
        ...(data.defaultMarkupCharge !== undefined && {
          defaultMarkupCharge: String(data.defaultMarkupCharge),
        }),
        ...(data.defaultTaskPrice !== undefined && {
          defaultTaskPrice: String(data.defaultTaskPrice),
        }),
        ...(data.defaultMaterialPrice !== undefined && {
          defaultMaterialPrice: String(data.defaultMaterialPrice),
        }),
      };

    // Remove undefined properties
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
          console.log('Settings not found during update, attempting to create defaults first.');
          // Changed from private method call
          const createdDefaults = await this.createAndReturnDefaultSettings({ userId });
          // Since defaults are now created, return them instead of throwing NOT_FOUND
          return createdDefaults;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to apply settings update.',
        });
      }

      return this.processSettingsForClient(updatedSetting);
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
      companyName: '',
      companyEmail: '',
      companyPhone: null,
      companyAddress: null,
      defaultComplexityCharge: String(DEFAULT_COMPLEXITY_CHARGE ?? 0),
      defaultMarkupCharge: String(DEFAULT_MARKUP_PERCENTAGE ?? 0),
      defaultTaskPrice: String(DEFAULT_TASK_PRICE ?? 0),
      defaultMaterialPrice: String(DEFAULT_MATERIAL_PRICE ?? 0),
      emailNotifications: true,
      quoteNotifications: true,
      taskNotifications: true,
      theme: 'system',
      locale: DEFAULT_LOCALE,
      currency: DEFAULT_CURRENCY,
      currencySymbol: DEFAULT_CURRENCY_SYMBOL,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    };

    try {
      const [newSettings] = await this.db.insert(settings).values(defaultSettingsData).returning();
      if (!newSettings) {
        throw new Error('Failed to retrieve settings immediately after creation.');
      }
      return this.processSettingsForClient(newSettings);
    } catch (error) {
      console.error(`Error creating default settings for user ${userId}:`, error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not create default settings.',
        cause: error,
      });
    }
  }

  /**
   * Helper function to convert DB string numeric values to actual numbers for client consumption.
   * @private
   */
  private processSettingsForClient(settingsData: SelectSetting): ClientSettingsData {
    const parseDecimal = (value: string | null | undefined): number => {
      if (value === null || value === undefined) return 0;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    return {
      ...settingsData,
      defaultComplexityCharge: parseDecimal(settingsData.defaultComplexityCharge),
      defaultMarkupCharge: parseDecimal(settingsData.defaultMarkupCharge),
      defaultTaskPrice: parseDecimal(settingsData.defaultTaskPrice),
      defaultMaterialPrice: parseDecimal(settingsData.defaultMaterialPrice),
      theme: settingsData.theme ?? 'system',
      locale: settingsData.locale ?? DEFAULT_LOCALE,
    };
  }
}
