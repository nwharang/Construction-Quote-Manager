import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { ProductCategory, products } from '~/server/db/schema';
import { eq, and, ilike, or, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

const productInput = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.nativeEnum(ProductCategory),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  sku: z.string().optional(),
  manufacturer: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const getAllInput = z.object({
  search: z.string().optional(),
  category: z.nativeEnum(ProductCategory).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export const productRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(getAllInput)
    .query(async ({ ctx, input }) => {
      const { search, category, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = and(
        eq(products.userId, ctx.session.user.id),
        ...(search
          ? [
              or(
                ilike(products.name, `%${search}%`),
                ilike(products.description, `%${search}%`),
                ilike(products.sku, `%${search}%`)
              ),
            ]
          : []),
        ...(category ? [eq(products.category, category)] : [])
      );

      const [items, total] = await Promise.all([
        ctx.db
          .select()
          .from(products)
          .where(where)
          .limit(limit)
          .offset(skip)
          .orderBy(products.createdAt),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(where)
          .then((result) => Number(result[0]?.count ?? 0)),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, input.id),
            eq(products.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!product[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      return product[0];
    }),

  create: protectedProcedure
    .input(productInput)
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate SKU if not provided
        const sku = input.sku || `SKU-${createId()}`;
        // Generate a unique ID for the product
        const id = createId();

        const product = await ctx.db
          .insert(products)
          .values({
            id,
            ...input,
            sku,
            unitPrice: input.unitPrice.toString(),
            userId: ctx.session.user.id,
          })
          .returning();

        return product[0];
      } catch (error) {
        console.error('Product creation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create product',
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: productInput }))
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify ownership
      const existingProduct = await ctx.db
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, id),
            eq(products.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!existingProduct[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      try {
        const product = await ctx.db
          .update(products)
          .set({
            ...data,
            unitPrice: data.unitPrice.toString(),
            updatedAt: new Date(),
          })
          .where(eq(products.id, id))
          .returning();

        return product[0];
      } catch (error) {
        console.error('Product update error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update product',
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existingProduct = await ctx.db
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, input.id),
            eq(products.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!existingProduct[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      try {
        await ctx.db.delete(products).where(eq(products.id, input.id));
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete product',
        });
      }
    }),
}); 