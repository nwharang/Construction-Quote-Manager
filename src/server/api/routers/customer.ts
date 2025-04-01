import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { customers } from '~/server/db/schema';
import { eq, and, like, sql, or, ilike, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { type SQL } from 'drizzle-orm';

const customerInput = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const customerRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { page, limit, search } = input;
        const offset = (page - 1) * limit;

        // 1. Build search condition
        const whereClause = and(
          eq(customers.userId, ctx.session.user.id),
          ...(search
            ? [
                or(
                  ilike(customers.name, `%${search}%`),
                  ilike(customers.email, `%${search}%`)
                )
              ]
            : [])
        );

        // 2. Get total count
        const countResult = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(customers)
          .where(whereClause);

        const total = Number(countResult[0]?.count ?? 0);

        // 3. Get customers with pagination
        const customerList = await ctx.db
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

        // 4. Add empty count field to maintain API compatibility
        const customersWithCounts = customerList.map(customer => ({
          ...customer,
          _count: {
            quotes: 0 // Default to 0 - will need to be updated in UI
          }
        }));

        return {
          customers: customersWithCounts,
          total,
          page,
          limit,
        };
      } catch (error) {
        console.error("Error fetching customers:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch customers',
          cause: error,
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid('Invalid customer ID format') }))
    .query(async ({ ctx, input }) => {
      try {
        // 1. Verify ownership and get customer data
        const customer = await ctx.db
          .select()
          .from(customers)
          .where(
            and(
              eq(customers.id, input.id),
              eq(customers.userId, ctx.session.user.id)
            )
          )
          .limit(1);

        if (!customer[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customer not found or does not belong to user',
          });
        }

        return customer[0];
      } catch (error) {
        console.error("Error fetching customer:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch customer',
          cause: error,
        });
      }
    }),

  create: protectedProcedure
    .input(customerInput)
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Create the customer
        const [createdCustomer] = await ctx.db
          .insert(customers)
          .values({
            ...input,
            userId: ctx.session.user.id,
          })
          .returning();

        if (!createdCustomer) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create customer',
          });
        }

        return createdCustomer;
      } catch (error) {
        console.error("Error creating customer:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create customer',
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('Invalid customer ID format'),
        ...customerInput.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;

        // 1. Verify customer exists and belongs to user
        const existingCustomer = await ctx.db
          .select()
          .from(customers)
          .where(
            and(
              eq(customers.id, id),
              eq(customers.userId, ctx.session.user.id)
            )
          )
          .limit(1);

        if (!existingCustomer[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customer not found or does not belong to user',
          });
        }

        // 2. Update the customer
        const [updatedCustomer] = await ctx.db
          .update(customers)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(customers.id, id),
              eq(customers.userId, ctx.session.user.id)
            )
          )
          .returning();

        if (!updatedCustomer) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update customer',
          });
        }

        return updatedCustomer;
      } catch (error) {
        console.error("Error updating customer:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update customer',
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid('Invalid customer ID format') }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Verify customer exists and belongs to user
        const existingCustomer = await ctx.db
          .select()
          .from(customers)
          .where(
            and(
              eq(customers.id, input.id),
              eq(customers.userId, ctx.session.user.id)
            )
          )
          .limit(1);

        if (!existingCustomer[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customer not found or does not belong to user',
          });
        }

        // 2. Delete the customer
        await ctx.db
          .delete(customers)
          .where(
            and(
              eq(customers.id, input.id),
              eq(customers.userId, ctx.session.user.id)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("Error deleting customer:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete customer',
          cause: error,
        });
      }
    }),
}); 