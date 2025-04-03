import { eq, and, sql, or, ilike, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { type DB } from './types';
import { customers, users } from '~/server/db/schema';
import { BaseService } from './baseService';
import type { Session } from 'next-auth';
import { z } from 'zod';

// Define input schema type for getAllCustomers based on router input
const getAllCustomersInputSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
});
type GetAllCustomersInput = z.infer<typeof getAllCustomersInputSchema>;

// Define input schema type for createCustomer based on router input
const createCustomerInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Define input schema type for updateCustomer based on router input
const updateCustomerInputSchema = z.object({
  // Exclude id from data payload
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
type UpdateCustomerInputData = z.infer<typeof updateCustomerInputSchema>;

export class CustomerService extends BaseService {
  constructor(db: DB, ctx: { session: Session | null }) {
    super(db, ctx);
  }

  /**
   * Get all customers with pagination and search.
   * Note: Ownership filtering is removed as per CONTEXT.md.
   */
  async getAllCustomers(input: GetAllCustomersInput) {
    const { page, limit, search } = input;
    const offset = (page - 1) * limit;

    // Build search condition (no userId filter)
    const searchCondition = search
      ? or(ilike(customers.name, `%${search}%`), ilike(customers.email, `%${search}%`))
      : undefined;

    const whereClause = searchCondition; // Use only search condition

    // Get total count based on the same filter
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereClause);

    const total = Number(countResult[0]?.count ?? 0);

    // Get customers with pagination
    const customerList = await this.db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        notes: customers.notes,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    // Add empty count for compatibility if needed, or adjust UI
    const customersWithCounts = customerList.map((customer) => ({
      ...customer,
      _count: { quotes: 0 }, // Placeholder
    }));

    return {
      customers: customersWithCounts, // Consider returning raw list if _count isn't used
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single customer by ID.
   * Note: Ownership filtering is removed as per CONTEXT.md.
   */
  async getCustomerById(id: string): Promise<typeof customers.$inferSelect> {
    const customer = await this.db.query.customers.findFirst({
      where: eq(customers.id, id),
      // Optionally add relations here if needed, e.g., with creator
    });

    if (!customer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Customer not found',
      });
    }

    // Map creator name if needed for response consistency
    return {
      ...customer,
    };
  }

  /**
   * Create a new customer.
   */
  async createCustomer(input: CreateCustomerInput): Promise<typeof customers.$inferSelect> {
    return this.db.transaction(async (tx) => {
      // Fetch creator name

      const [newCustomer] = await tx
        .insert(customers)
        .values({
          // Spread the validated input directly
          ...input,
          creatorId: this.currentUser?.user.id,
          creatorName: this.currentUser?.user.name,
          // Let DB handle default timestamps
          // createdAt: new Date(),
          // updatedAt: new Date(),
        })
        .returning();

      if (!newCustomer) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create customer',
        });
      }
      return newCustomer;
    });
  }

  /**
   * Update an existing customer.
   * No ownership check applied here per CONTEXT.md.
   */
  async updateCustomer(
    id: string,
    data: UpdateCustomerInputData
  ): Promise<typeof customers.$inferSelect> {
    // 1. Verify customer exists (optional, update will fail if not found)
    const existing = await this.db.query.customers.findFirst({
      where: eq(customers.id, id),
      columns: { id: true },
    });
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found.' });
    }

    // 2. Prepare update payload
    const updatePayload: Partial<typeof customers.$inferInsert> = {
      ...data, // Spread validated input data
      updatedAt: new Date(),
    };

    // 3. Perform the update
    const [updatedCustomer] = await this.db
      .update(customers)
      .set(updatePayload)
      .where(eq(customers.id, id))
      .returning();

    if (!updatedCustomer) {
      // Should not happen if existence check passes and update is valid
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update customer after verification.',
      });
    }

    return updatedCustomer;
  }

  /**
   * Delete a customer.
   * Note: Database uses ON DELETE RESTRICT for quotes.customerId,
   * so deletion will fail at DB level if customer has quotes.
   * No ownership check applied here per CONTEXT.md.
   */
  async deleteCustomer(id: string): Promise<{ success: boolean; deletedId: string | undefined }> {
    // 1. Verify customer exists (optional, delete will fail if not found)
    const existing = await this.db.query.customers.findFirst({
      where: eq(customers.id, id),
      columns: { id: true },
    });
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found.' });
    }

    // 2. Perform delete (DB handles FK constraint check)
    const result = await this.db
      .delete(customers)
      .where(eq(customers.id, id))
      .returning({ deletedId: customers.id });

    if (result.length === 0) {
      // This might happen if the row was deleted between the check and the delete,
      // or potentially if the FK constraint error wasn't caught nicely.
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Failed to delete customer. It might have associated quotes or was already deleted.',
      });
    }

    return { success: true, deletedId: result[0]?.deletedId };
  }
}
