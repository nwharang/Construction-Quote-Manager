import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';
import { CategoryService, categoryInputSchema } from '~/server/services/categoryService';

// Category router for handling category-related API endpoints
export const categoryRouter = createTRPCRouter({
  // Get all categories with pagination and search
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        page: z.number().min(1).default(1),
        search: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Initialize the CategoryService with the current context
      const categoryService = new CategoryService(ctx.db, ctx);
      return categoryService.getAll(input);
    }),

  // Get a single category by ID
  getById: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Initialize the CategoryService with the current context
      const categoryService = new CategoryService(ctx.db, ctx);
      return categoryService.getById(input.id);
    }),

  // Create a new category
  create: protectedProcedure
    .input(categoryInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Initialize the CategoryService with the current context
      const categoryService = new CategoryService(ctx.db, ctx);
      return categoryService.create(input);
    }),

  // Update an existing category
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1, { message: 'Name is required' }),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Initialize the CategoryService with the current context
      const categoryService = new CategoryService(ctx.db, ctx);
      const { id, ...data } = input;
      return categoryService.update(id, data);
    }),

  // Delete a category
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Initialize the CategoryService with the current context
      const categoryService = new CategoryService(ctx.db, ctx);
      return categoryService.delete(input.id);
    }),

  // Get products by category
  getProductsByCategory: publicProcedure
    .input(
      z.object({
        categoryId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(10),
        page: z.number().min(1).default(1),
      })
    )
    .query(async ({ ctx, input }) => {
      // Initialize the CategoryService with the current context
      const categoryService = new CategoryService(ctx.db, ctx);
      const { categoryId, ...pagination } = input;
      return categoryService.getProductsByCategory(categoryId, pagination);
    }),
}); 