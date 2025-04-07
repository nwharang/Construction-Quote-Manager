import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { QuoteStatus, type QuoteStatusType } from '~/server/db/schema';
import { TRPCError } from '@trpc/server';
import { createServices } from '~/server/services';
import { AuthService } from '~/server/services/authService';
import { db } from '~/server/db';

// Define reusable nested schemas with UUIDs
const quoteMaterialInputSchema = z.object({
  id: z.string().uuid().optional(), // For existing materials during update
  productId: z.string().uuid('Valid product ID is required').optional().nullable(), // Ensure UUID, allow null if product not selected
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  notes: z.string().optional().nullable(),
});

const taskInputSchema = z.object({
  id: z.string().uuid().optional(), // For existing tasks during update
  description: z.string().min(1, 'Task description is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  materialType: z.enum(['lumpsum', 'itemized']), // Use lowercase as before
  estimatedMaterialsCostLumpSum: z.number().min(0).optional().nullable(),
  materials: z.array(quoteMaterialInputSchema).optional(),
});

// Type inferred from the material input schema
// type MaterialInputType = z.infer<typeof quoteMaterialInputSchema>; // Can be removed if not used

export const quoteRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z
          .enum([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED])
          .optional(),
        customerId: z.string().uuid('Invalid customer ID format').optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const services = createServices(ctx);

        // Pass input WITHOUT userId
        const quotes = await services.quote.getAllQuotes({
          ...input,
        } as {
          search?: string;
          customerId?: string;
          status?: QuoteStatusType;
          page: number;
          limit: number;
        });

        return quotes;
      } catch (error) {
        console.error('Error getting quotes:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get quotes',
          cause: error,
        });
      }
    }),

  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, 'Quote ID is required'),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const services = createServices(ctx);

        // Pass input WITHOUT userId
        const quote = await services.quote.getQuoteById({
          id: input.id,
          includeRelated: true,
          // userId removed from this call
        });

        return quote;
      } catch (error) {
        console.error('Error getting quote:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get quote',
          cause: error,
        });
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Title is required'),
        customerId: z.string().uuid('Valid customer ID is required'),
        notes: z.string().optional().nullable(),
        markupPercentage: z.number().min(0).max(1).default(0),
        status: z
          .enum([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED])
          .optional(),
        tasks: z
          .array(
            z.object({
              description: z.string().min(1, 'Task description is required'),
              price: z.number().min(0, 'Price must be a positive number'),
              materialType: z.enum(['lumpsum', 'itemized']),
              estimatedMaterialsCostLumpSum: z
                .number()
                .min(0, 'Estimated cost must be non-negative')
                .optional()
                .nullable(),
              materials: z
                .array(
                  z.object({
                    quantity: z.number().min(1, 'Quantity must be at least 1'),
                    unitPrice: z.number().min(0, 'Unit price must be a positive number'),
                    productId: z.string().uuid('Product ID must be a valid UUID'),
                    notes: z.string().optional().nullable(),
                  })
                )
                .optional()
                .default([]),
            })
          )
          .optional()
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const services = createServices(ctx);
        // userId is available in service context via BaseService, no need to fetch here unless explicitly needed by service method signature
        // const authService = new AuthService(db, ctx);
        // const userId = authService.getUserId();
        const serviceData = {
          customerId: input.customerId,
          title: input.title,
          status: input.status,
          markupPercentage: input.markupPercentage,
          notes: input.notes ?? undefined,
          tasks: input.tasks?.map((task) => ({
            description: task.description,
            price: task.price,
            materialType: task.materialType,
            estimatedMaterialsCostLumpSum: task.estimatedMaterialsCostLumpSum ?? undefined,
            materials: task.materials?.map((mat) => ({
              productId: mat.productId,
              quantity: mat.quantity,
              unitPrice: mat.unitPrice,
              notes: mat.notes ?? undefined,
            })),
          })),
        };

        const quote = await services.quote.createQuote({
          data: serviceData,
          // FIX: Remove userId as it's not expected by the service method
          // userId: userId,
        });
        return quote;
      } catch (error) {
        console.error('Error creating quote:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create quote',
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('Quote ID must be a valid UUID'),
        title: z.string().min(1, 'Title is required'),
        notes: z.string().optional().nullable(),
        status: z
          .enum([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED])
          .optional(),
        customerId: z.string().uuid('Valid customer ID is required'),
        markupPercentage: z.number().min(0).default(10),
        tasks: z
          .array(
            z.object({
              id: z.string().optional(),
              description: z.string().min(1, 'Task description is required'),
              price: z.number().min(0, 'Price must be a positive number'),
              materialType: z.enum(['lumpsum', 'itemized']),
              estimatedMaterialsCostLumpSum: z
                .number()
                .min(0, 'Estimated cost must be non-negative')
                .optional()
                .nullable(),
              materials: z
                .array(
                  z.object({
                    id: z.string().optional(),
                    productId: z.string().uuid('Product ID must be a valid UUID'),
                    quantity: z.number().min(1, 'Quantity must be at least 1'),
                    unitPrice: z.number().min(0, 'Unit price must be a positive number'),
                    notes: z.string().optional().nullable(),
                  })
                )
                .optional()
                .default([]),
            })
          )
          .optional()
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const services = createServices(ctx);

        const serviceData = {
          id: input.id,
          customerId: input.customerId,
          title: input.title,
          status: input.status,
          markupPercentage: input.markupPercentage,
          notes: input.notes ?? undefined,
          tasks: input.tasks?.map((task) => ({
            id: task.id,
            description: task.description,
            price: task.price,
            materialType: task.materialType,
            estimatedMaterialsCostLumpSum: task.estimatedMaterialsCostLumpSum ?? undefined,
            materials: task.materials?.map((mat) => ({
              id: mat.id,
              productId: mat.productId,
              quantity: mat.quantity,
              unitPrice: mat.unitPrice,
              notes: mat.notes ?? undefined,
            })),
          })),
        };

        const quote = await services.quote.updateQuote({
          id: input.id,
          data: serviceData,
          // FIX: Remove userId as it's not expected by the service method
          // userId: userId,
        });
        return quote;
      } catch (error) {
        console.error('Error updating quote:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update quote',
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, 'Quote ID is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const services = createServices(ctx);
        // userId is available in service context via BaseService
        // const authService = new AuthService(db, ctx);
        // const userId = authService.getUserId();

        const result = await services.quote.deleteQuote({
          id: input.id,
          // FIX: Remove userId as it's not expected by the service method
          // userId: userId,
        });

        return result;
      } catch (error) {
        console.error('Error deleting quote:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete quote',
          cause: error,
        });
      }
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const services = createServices(ctx);

      const stats = await services.dashboard.getDashboardStats();

      return stats;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch dashboard stats',
        cause: error,
      });
    }
  }),

  updateCharges: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('Invalid quote ID format'),
        complexityCharge: z.number().min(0, 'Complexity charge must be non-negative'),
        markupCharge: z.number().min(0, 'Markup charge must be non-negative'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const services = createServices(ctx);

        const updatedQuote = await services.quote.updateCharges({
          id: input.id,
          complexityCharge: input.complexityCharge,
          markupCharge: input.markupCharge,
        });

        return updatedQuote;
      } catch (error) {
        console.error('Error updating quote charges:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update quote charges',
          cause: error,
        });
      }
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('Invalid quote ID format'),
        status: z.enum(
          [QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED],
          {
            errorMap: () => ({ message: 'Status must be one of: DRAFT, SENT, ACCEPTED, REJECTED' }),
          }
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const services = createServices(ctx);

        const updatedQuote = await services.quote.updateStatus({
          id: input.id,
          status: input.status,
        });

        return updatedQuote;
      } catch (error) {
        console.error('Error updating quote status:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update quote status',
          cause: error,
        });
      }
    }),

  addTask: protectedProcedure
    .input(
      z.object({
        quoteId: z.string().uuid('Invalid quote ID format'),
        description: z.string().min(1, 'Description is required'),
        price: z.number().min(0, 'Price must be a non-negative number'),
        materialType: z.enum(['lumpsum', 'itemized']),
        estimatedMaterialsCostLumpSum: z
          .number()
          .min(0, 'Estimated cost must be non-negative')
          .optional()
          .nullable(),
        materials: z
          .array(
            z.object({
              productId: z.string().uuid('Product ID must be a valid UUID'),
              quantity: z.number().min(1, 'Quantity must be at least 1'),
              unitPrice: z.number().min(0, 'Unit price must be non-negative'),
              notes: z.string().optional().nullable(),
            })
          )
          .optional()
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const services = createServices(ctx);

        const serviceTaskData = {
          description: input.description,
          price: input.price,
          materialType: input.materialType,
          estimatedMaterialsCostLumpSum: input.estimatedMaterialsCostLumpSum ?? undefined,
          materials: input.materials?.map((mat) => ({
            productId: mat.productId,
            quantity: mat.quantity,
            unitPrice: mat.unitPrice,
            notes: mat.notes ?? undefined,
          })),
        };

        const task = await services.quote.addTask({
          quoteId: input.quoteId,
          taskData: serviceTaskData,
        });

        return task;
      } catch (error) {
        console.error('Error adding task:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add task',
          cause: error,
        });
      }
    }),
});
