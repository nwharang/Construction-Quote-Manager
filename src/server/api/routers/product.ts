import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { createId } from '@paralleldrive/cuid2';
import { ProductService } from '../../services/productService';
import { db } from '../../db'; // Assuming db instance is exported from here

const productInput = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  unit: z.string().min(1, 'Unit is required').nullish(),
  sku: z.string().optional(),
  manufacturer: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// Define or import Zod schemas matching ProductService inputs
const createProductInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().nullable(),
  unitPrice: z.number().min(0).optional().default(0),
  unit: z.string().optional().nullable(),
  inventory: z.number().int().optional().default(0),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateProductInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  unitPrice: z.number().min(0).optional(),
  unit: z.string().optional().nullable(),
  inventory: z.number().int().optional(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const deleteProductInputSchema = z.object({
  id: z.string().uuid(),
});

const getProductByIdInputSchema = z.object({
  id: z.string().uuid(),
});

const getAllProductsInputSchema = z
  .object({
    orderBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    filter: z.string().optional(),
    page: z.number().min(1).optional().default(1),
    pageSize: z.number().min(1).max(100).optional().default(10),
  })
  .optional();

export const productRouter = createTRPCRouter({
  getAll: protectedProcedure.input(getAllProductsInputSchema).query(({ ctx, input }) => {
    const productService = new ProductService(db, ctx);
    // Pass optional inputs directly to the service method
    return productService.getAll(input);
  }),

  getInfiniteList: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().uuid().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const productService = new ProductService(db, ctx);
        const result = await productService.getInfiniteProducts(input);
        return result;
      } catch (error) {
        console.error('Error fetching infinite product list:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch product list for selection',
          cause: error,
        });
      }
    }),

  getById: protectedProcedure.input(getProductByIdInputSchema).query(({ ctx, input }) => {
    const productService = new ProductService(db, ctx);
    return productService.getById({ id: input.id });
  }),

  create: protectedProcedure.input(createProductInputSchema).mutation(({ ctx, input }) => {
    const productService = new ProductService(db, ctx);
    return productService.create({ data: input });
  }),

  update: protectedProcedure.input(updateProductInputSchema).mutation(({ ctx, input }) => {
    const productService = new ProductService(db, ctx);
    return productService.update({ data: input });
  }),

  delete: protectedProcedure.input(deleteProductInputSchema).mutation(({ ctx, input }) => {
    const productService = new ProductService(db, ctx);
    return productService.delete({ data: input });
  }),
});
