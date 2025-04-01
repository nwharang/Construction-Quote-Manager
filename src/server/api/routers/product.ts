import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { ProductCategory, products } from '~/server/db/schema';
import { eq, and, ilike, or, sql, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

const productInput = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.nativeEnum(ProductCategory),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  unit: z.string().min(1, 'Unit is required').nullish(),
  sku: z.string().optional(),
  manufacturer: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const productRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.nativeEnum(ProductCategory).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { search, category, page, limit } = input;
        const offset = (page - 1) * limit;

        // Build where clause for filtering
        const whereClause = and(
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

        // Get total count
        const countResult = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(whereClause);

        const total = Number(countResult[0]?.count ?? 0);

        // Get products with pagination
        const items = await ctx.db
          .select()
          .from(products)
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(products.createdAt));

        return {
          items,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      } catch (error) {
        console.error("Error fetching products:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch products',
          cause: error,
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // Verify ownership and get product data
        const product = await ctx.db
          .select()
          .from(products)
          .where(and(
            eq(products.id, input.id), 
            eq(products.userId, ctx.session.user.id)
          ))
          .limit(1);

        if (!product[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found or does not belong to user',
          });
        }

        return product[0];
      } catch (error) {
        console.error("Error fetching product:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch product',
          cause: error,
        });
      }
    }),

  create: protectedProcedure
    .input(productInput)
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Generate unique identifiers
        const sku = input.sku || `SKU-${createId()}`;
        const id = createId();

        // 2. Ensure unit is a string even if nullish from input
        const unit = input.unit || '';

        // 3. Create the product
        const [createdProduct] = await ctx.db
          .insert(products)
          .values({
            id,
            name: input.name,
            description: input.description,
            category: input.category,
            unitPrice: input.unitPrice.toString(),
            unit,
            sku,
            manufacturer: input.manufacturer,
            supplier: input.supplier,
            location: input.location,
            notes: input.notes,
            userId: ctx.session.user.id,
          })
          .returning();

        if (!createdProduct) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create product',
          });
        }

        return createdProduct;
      } catch (error) {
        console.error('Error creating product:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create product',
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(z.object({ 
      id: z.string(), 
      data: productInput 
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, data } = input;

        // 1. Verify product exists and belongs to user
        const existingProduct = await ctx.db
          .select()
          .from(products)
          .where(and(
            eq(products.id, id), 
            eq(products.userId, ctx.session.user.id)
          ))
          .limit(1);

        if (!existingProduct[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found or does not belong to user',
          });
        }

        // 2. Ensure unit is a string even if nullish from input
        const unit = data.unit || '';

        // 3. Update the product
        const [updatedProduct] = await ctx.db
          .update(products)
          .set({
            name: data.name,
            description: data.description,
            category: data.category,
            unitPrice: data.unitPrice.toString(),
            unit,
            sku: data.sku,
            manufacturer: data.manufacturer,
            supplier: data.supplier,
            location: data.location,
            notes: data.notes,
            updatedAt: new Date(),
          })
          .where(and(
            eq(products.id, id),
            eq(products.userId, ctx.session.user.id)
          ))
          .returning();

        if (!updatedProduct) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update product',
          });
        }

        return updatedProduct;
      } catch (error) {
        console.error('Error updating product:', error);
        if (error instanceof TRPCError) throw error;
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
      try {
        // 1. Verify product exists and belongs to user
        const existingProduct = await ctx.db
          .select()
          .from(products)
          .where(and(
            eq(products.id, input.id), 
            eq(products.userId, ctx.session.user.id)
          ))
          .limit(1);

        if (!existingProduct[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found or does not belong to user',
          });
        }

        // 2. Delete the product
        await ctx.db
          .delete(products)
          .where(and(
            eq(products.id, input.id),
            eq(products.userId, ctx.session.user.id)
          ));

        return { success: true };
      } catch (error) {
        console.error('Error deleting product:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete product',
          cause: error,
        });
      }
    }),
});
