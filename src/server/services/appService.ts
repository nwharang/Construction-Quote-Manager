import { eq } from 'drizzle-orm';
import { BaseService } from './baseService';
import { ServiceError, ServiceErrorCode } from './types';
import { settings } from '../db/schema';

/**
 * Service for managing application settings
 */
export class AppService extends BaseService {
  /**
   * Get settings for a user
   */
  async getSettings(userId?: string) {
    if (this.currentUser) {
      const userSettings = await this.db.query.settings.findFirst({
        where: eq(settings.userId, this.currentUser.user.id),
      });

      if (!userSettings) {
        // Create default settings if none exist
        return this.createDefaultSettings();
      }

      return userSettings;
    }
  }
  /**
   * Update settings for a user
   */
  async updateSettings(data: Partial<typeof settings.$inferInsert>, userId?: string) {
    const existingSettings = this.currentUser?.user.id
      ? await this.db.query.settings.findFirst({
          where: eq(settings.userId, this.currentUser.user.id),
        })
      : this.createDefaultSettings();

    if (this.currentUser?.user.id) {
      return await this.db
        .update(settings)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(settings.userId, this.currentUser?.user.id))
        .returning();
    }

    return this.createDefaultSettings();
  }

  /**
   * Create default settings for a new user
   */
  private async createDefaultSettings() {
    const defaultSettings = {
      userId: this.currentUser?.user.id,
      companyName: '',
      companyEmail: '',
      companyPhone: '',
      companyAddress: '',
      defaultComplexityCharge: '0.00',
      defaultMarkupCharge: '0.00',
      defaultTaskPrice: '0.00',
      defaultMaterialPrice: '0.00',
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

    return defaultSettings;
  }
}
