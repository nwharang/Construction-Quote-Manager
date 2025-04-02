import { type Session } from 'next-auth';
import { type DB, type ServiceContext, ServiceError, ServiceErrorCode } from './types';

/**
 * Base Service class with common functionality
 */
export abstract class BaseService {
  protected db: DB;

  // Default system user ID for single-user mode
  protected currentUser: Session | null;
  constructor(db: DB, ctx: { session: Session | null }) {
    this.db = db;
    this.currentUser = ctx.session;
  }

  /**
   * Create a service context with user ID
   */
  protected createContext(): ServiceContext {
    return { currentUser: this.currentUser };
  }

  /**
   * Validate that a record exists and belongs to the user
   */
  protected async validateOwnership<T extends { userId: string }>(
    record: T | null,
    userId: string,
    entityName: string
  ): Promise<T> {
    if (!record) {
      throw new ServiceError(ServiceErrorCode.NOT_FOUND, `${entityName} not found`);
    }

    if (record.userId !== userId && userId !== this.currentUser?.user.id) {
      throw new ServiceError(
        ServiceErrorCode.FORBIDDEN,
        `You do not have permission to access this ${entityName}`
      );
    }

    return record;
  }

  /**
   * Round a number to 2 decimal places for currency
   */
  protected roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Convert string or number to number, handling null/undefined
   */
  protected toNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
  }

  generateId(): string {
    return crypto.randomUUID();
  }
}
