/**
 * Base Service class with common functionality
 */
export class BaseService {
  // Default system user ID for single-user mode
  protected defaultUserId = 'system-user';

  /**
   * Ensure we always have a user ID value
   */
  protected ensureUserId(userId?: string): string {
    return userId || this.defaultUserId;
  }
}
