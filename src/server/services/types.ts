import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Session } from 'next-auth';
import type * as schema from '~/server/db/schema';
import type { QuoteStatusType } from '~/server/db/schema';

/**
 * Service context interface
 */
export interface ServiceContext {
  currentUser: Session | null;
}

/**
 * Common error codes used across services
 */
export enum ServiceErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Service error class for consistent error handling
 */
export class ServiceError extends Error {
  constructor(
    public code: ServiceErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Database type used by all services
 * Uses Drizzle's PostgresJsDatabase type with our schema
 */
export type DB = PostgresJsDatabase<typeof schema>;

/**
 * Common types used across services
 */
export interface BaseEntityFields {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string | null;
}

/**
 * Quote-specific types
 */
export interface QuoteFields extends BaseEntityFields {
  title: string;
  status: QuoteStatusType;
  customerId: string | null;
  notes: string | null;
  markupCharge: number;
  grandTotal: number;
  sequentialId: number;
}

/**
 * Task-specific types
 */
export interface TaskFields extends BaseEntityFields {
  quoteId: string;
  description: string;
  price: number;
  estimatedMaterialsCostLumpSum: number | null;
  order: number;
}

/**
 * Material-specific types
 */
export interface MaterialFields extends BaseEntityFields {
  taskId: string;
  productId: string | null;
  quantity: number;
  unitPrice: number;
  notes: string | null;
}

/**
 * Customer-specific types (Re-added)
 */
export interface CustomerFields extends BaseEntityFields {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  // creatorId is inherited from BaseEntityFields
  creatorName: string | null; // Matches schema, allow null
}

/**
 * Product Category-specific types (Re-added)
 */
export interface ProductCategoryFields extends BaseEntityFields {
  name: string;
  // creatorId is inherited from BaseEntityFields
  creatorName: string | null; // Matches schema, allow null
}

// Need ProductFields as well for ProductService
/**
 * Product-specific types
 */
export interface ProductFields extends BaseEntityFields {
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  unitPrice: string; // Stored as decimal/string in DB
  unit: string | null;
  sku: string | null;
  manufacturer: string | null;
  supplier: string | null;
  location: string | null;
  notes: string | null;
  // creatorId is inherited from BaseEntityFields
  creatorName: string | null; // Matches schema, allow null
}
