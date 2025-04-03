import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { type DB, type CustomerFields } from './types';
import { customers, users } from '~/server/db/schema';
import { BaseService } from './baseService';
import type { Session } from 'next-auth';

export class CustomerService extends BaseService {
  constructor(db: DB, ctx: { session: Session | null }) {
    super(db, ctx);
  }

  /**
   * Get all customers.
   * No creatorId filtering applied per relaxed rules.
   */
  async getAllCustomers() {
    return this.db.query.customers.findMany();
  }

  /**
   * Get a single customer by ID.
   * Throws NOT_FOUND if the customer does not exist.
   */
  async getCustomerById({ id }: { id: string }) {
    const customer = await this.db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!customer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Customer with ID '${id}' not found.`,
      });
    }
    return customer;
  }

  /**
   * Create a new customer.
   * Sets creatorId and creatorName based on the context.
   */
  async createCustomer({
    data,
    creatorId,
  }: {
    data: Omit<CustomerFields, 'id' | 'creatorId' | 'creatorName' | 'createdAt' | 'updatedAt'>;
    creatorId: string;
  }) {
    return this.db.transaction(async (tx) => {
      // Fetch creator name
      const creator = await tx.query.users.findFirst({
        where: eq(users.id, creatorId),
        columns: { name: true },
      });
      const creatorName = creator?.name ?? 'System'; // Fallback if user not found (shouldn't happen in protected routes)

      const [newCustomer] = await tx
        .insert(customers)
        .values({
          ...data,
          creatorId: creatorId,
          creatorName: creatorName,
          createdAt: new Date(),
          updatedAt: new Date(),
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
   * Refetches creatorName if creatorId is updated.
   */
  async updateCustomer({
    id,
    data,
  }: {
    id: string;
    data: Partial<Omit<CustomerFields, 'id' | 'createdAt' | 'updatedAt'>>;
  }) {
    return this.db.transaction(async (tx) => {
      // 1. Verify customer exists - Fetch full object
      const existingCustomer = await tx.query.customers.findFirst({
        where: eq(customers.id, id),
      });

      if (!existingCustomer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Customer with ID '${id}' not found.`,
        });
      }

      // 2. Prepare update payload
      // Remove creatorId and creatorName from direct update possibility
      const { creatorId, creatorName, ...restData } = data;

      const updatePayload: Record<string, any> = {
        ...restData, // Use the rest of the data
        updatedAt: new Date(),
      };

      // 3. Remove logic for refetching/updating creatorName
      /*
      // Refetch creatorName ONLY if creatorId is being changed
      if (data.creatorId && data.creatorId !== existingCustomer.userId) {
        const creator = await tx.query.users.findFirst({
          where: eq(users.id, data.creatorId),
          columns: { name: true },
        });
        updatePayload.creatorName = creator?.name ?? 'System';
        updatePayload.creatorId = data.creatorId;
      } else {
        delete updatePayload.creatorId;
      }

      // If creatorName was provided directly in data and creatorId wasn't changed,
      // allow updating creatorName directly (e.g., admin correction)
      if (data.creatorName !== undefined && !data.creatorId) {
        updatePayload.creatorName = data.creatorName;
      }
      */

      // 4. Perform the update
      const [updatedCustomer] = await tx
        .update(customers)
        .set(updatePayload)
        .where(eq(customers.id, id))
        .returning();

      if (!updatedCustomer) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update customer',
        });
      }

      return updatedCustomer;
    });
  }

  /**
   * Delete a customer.
   * Note: Database uses ON DELETE RESTRICT for quotes.customerId,
   * so deletion will fail at DB level if customer has quotes.
   * Consider adding specific error handling for FK violations if needed.
   */
  async deleteCustomer({ id }: { id: string }) {
    return this.db.transaction(async (tx) => {
      // 1. Verify customer exists
      await tx.query.customers
        .findFirst({
          where: eq(customers.id, id),
          columns: { id: true }, // Only need to confirm existence
        })
        .then((c) => {
          if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found.' });
        });

      // 2. Perform delete (DB handles FK constraint check)
      const result = await tx
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
    });
  }
}
