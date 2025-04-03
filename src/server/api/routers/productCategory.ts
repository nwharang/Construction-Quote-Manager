import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { ProductCategoryService } from '../../services/productCategoryService';
import { db } from '../../db'; // Assuming db instance is exported from here

// Re-define or import Zod schemas used for input validation in the service
// (Ensures router inputs match service expectations)
const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateCategoryInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

const deleteCategoryInputSchema = z.object({
  id: z.string().uuid(),
});

const getCategoryByIdInputSchema = z.object({
  id: z.string().uuid(),
});

const getAllCategoriesInputSchema = z.object({
    orderBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    // Add filter/pagination inputs if needed
}).optional();

export const productCategoryRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(getAllCategoriesInputSchema)
    .query(({ ctx, input }) => {
      const productCategoryService = new ProductCategoryService(db, ctx);
      return productCategoryService.getAll(input);
    }),

  getById: protectedProcedure
    .input(getCategoryByIdInputSchema)
    .query(({ ctx, input }) => {
      const productCategoryService = new ProductCategoryService(db, ctx);
      return productCategoryService.getById({ id: input.id });
    }),

  create: protectedProcedure
    .input(createCategoryInputSchema)
    .mutation(({ ctx, input }) => {
      const productCategoryService = new ProductCategoryService(db, ctx);
      return productCategoryService.create({ data: input });
    }),

  update: protectedProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ ctx, input }) => {
      const productCategoryService = new ProductCategoryService(db, ctx);
      return productCategoryService.update({ data: input });
    }),

  delete: protectedProcedure
    .input(deleteCategoryInputSchema)
    .mutation(({ ctx, input }) => {
      const productCategoryService = new ProductCategoryService(db, ctx);
      return productCategoryService.delete({ data: input });
    }),
}); 