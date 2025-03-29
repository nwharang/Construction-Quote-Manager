import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { customers } from '~/server/db/schema';
import { eq, and, like, sql, or, ilike } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

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

        // Build search condition
        let whereClause = eq(customers.userId, ctx.session.user.id);
        
        if (search) {
          whereClause = and(
            whereClause,
            or(
              ilike(customers.name, `%${search}%`),
              ilike(customers.email, `%${search}%`)
            )
          );
        }

        // Get total count
        const countResult = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(customers)
          .where(whereClause);

        const total = Number(countResult[0]?.count ?? 0);

        // Get customers with pagination
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
            _count: {
              quotes: sql<number>`(SELECT COUNT(*) FROM quotes WHERE customer_id = ${customers.id})`,
            },
          })
          .from(customers)
          .where(whereClause)
          .orderBy(customers.createdAt)
          .limit(limit)
          .offset(offset);

        return {
          customers: customerList,
          total,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch customers',
          cause: error,
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
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
            message: 'Customer not found',
          });
        }

        return customer[0];
      } catch (error) {
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
        const [customer] = await ctx.db
          .insert(customers)
          .values({
            ...input,
            userId: ctx.session.user.id,
          })
          .returning();

        return customer;
      } catch (error) {
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
        id: z.string().uuid(),
        ...customerInput.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;

        // Check if customer exists and belongs to user
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
            message: 'Customer not found',
          });
        }

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

        return updatedCustomer;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update customer',
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if customer exists and belongs to user
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
            message: 'Customer not found',
          });
        }

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
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete customer',
          cause: error,
        });
      }
    }),
}); 