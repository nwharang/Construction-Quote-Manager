import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import {
  quotes,
  tasks,
  materials,
  QuoteStatus,
  customers,
  type QuoteStatusType,
} from '~/server/db/schema';
import { and, eq, ilike, or, sql, desc, type SQL, ne, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createServices } from '~/server/services';

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
        markupPercentage: z.number().min(0).default(10),
        status: z
          .enum([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED])
          .optional(),
        tasks: z
          .array(
            z.object({
              description: z.string().min(1, 'Task description is required'),
              price: z.number().min(0, 'Price must be a positive number'),
              materialType: z.enum(['lumpsum', 'itemized']),
              estimatedMaterialsCost: z.number().min(0).optional(),
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

        // Explicitly map input to service data structure
        const serviceData = {
          customerId: input.customerId,
          title: input.title,
          status: input.status,
          markupPercentage: input.markupPercentage,
          notes: input.notes ?? undefined, // Map null to undefined
          tasks: input.tasks?.map((task) => ({
            description: task.description,
            price: task.price,
            materialType: task.materialType,
            estimatedMaterialsCost: task.estimatedMaterialsCost,
            materials: task.materials?.map((mat) => ({
              // name/description removed
              productId: mat.productId,
              quantity: mat.quantity,
              unitPrice: mat.unitPrice,
              notes: mat.notes ?? undefined, // Map null to undefined
            })),
          })),
        };

        const quote = await services.quote.createQuote({
          data: serviceData,
          userId: 'system-user',
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
        id: z.string().uuid('Invalid quote ID format'),
        title: z.string().min(1, 'Title is required').optional(),
        customerId: z.string().uuid('Valid customer ID is required').optional(),
        notes: z.string().optional().nullable(),
        status: z
          .enum([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED])
          .optional(),
        markupPercentage: z.number().min(0).optional(),
        tasks: z
          .array(
            z.object({
              id: z.string().uuid().optional(),
              description: z.string().min(1, 'Task description is required').optional(),
              price: z.number().min(0, 'Price must be a positive number').optional(),
              quantity: z.number().min(1, 'Quantity must be at least 1').optional(),
              materialType: z.enum(['lumpsum', 'itemized']).optional(),
              estimatedMaterialsCostLumpSum: z.number().min(0).optional().nullable(),
              materials: z
                .array(
                  z.object({
                    id: z.string().uuid().optional(),
                    name: z.string().min(1, 'Material name is required').optional(),
                    description: z.string().optional().nullable(),
                    quantity: z.number().min(1, 'Quantity must be at least 1').optional(),
                    unitPrice: z.number().min(0, 'Unit price must be a positive number').optional(),
                    productId: z.string().uuid().optional().nullable(),
                    notes: z.string().optional().nullable(),
                  })
                )
                .optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const services = createServices(ctx);

        // Explicitly map input to service data structure
        const serviceData = {
          customerId: input.customerId,
          title: input.title,
          status: input.status,
          markupPercentage: input.markupPercentage,
          notes: input.notes ?? undefined, // Map null to undefined
          tasks: input.tasks?.map((task) => ({
            id: task.id,
            description: task.description,
            price: task.price,
            materialType: task.materialType,
            estimatedMaterialsCostLumpSum: task.estimatedMaterialsCostLumpSum,
            materials: task.materials?.map((mat) => ({
              id: mat.id,
              // name/description removed
              productId: mat.productId ?? undefined, // Map null to undefined for optional DB field?
              quantity: mat.quantity,
              unitPrice: mat.unitPrice,
              notes: mat.notes ?? undefined, // Map null to undefined
            })),
          })),
        };

        const quote = await services.quote.updateQuote({
          id: input.id,
          data: serviceData,
          userId: 'system-user',
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

        // Keep passing userId (placeholder)
        const result = await services.quote.deleteQuote({
          id: input.id,
          userId: 'system-user',
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

      const stats = await services.dashboard.getDashboardStats('system-user'); // Use a consistent system user

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

        // Keep passing userId (placeholder)
        const updatedQuote = await services.quote.updateCharges({
          id: input.id,
          complexityCharge: input.complexityCharge,
          markupCharge: input.markupCharge,
          userId: 'system-user',
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

        // Keep passing userId (placeholder)
        const updatedQuote = await services.quote.updateStatus({
          id: input.id,
          status: input.status,
          userId: 'system-user',
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
        estimatedMaterialsCost: z.number().min(0, 'Estimated cost must be non-negative').optional(),
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

        // Explicitly map input to service taskData structure
        const serviceTaskData = {
          description: input.description,
          price: input.price,
          materialType: input.materialType,
          estimatedMaterialsCost: input.estimatedMaterialsCost,
          materials: input.materials?.map((mat) => ({
            // name/description removed
            productId: mat.productId,
            quantity: mat.quantity,
            unitPrice: mat.unitPrice,
            notes: mat.notes ?? undefined, // Map null to undefined
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

  // Need routers for Task and Material update/delete separate from quote?
  // Assuming task updates/deletes happen via quote update for now.
  // Let's stub placeholder routers for task/material updates/deletes
  // if they are intended to be standalone.

  // Example placeholder if updateTask was meant to be standalone:
  /*
  updateTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        description: z.string().optional(),
        price: z.number().optional(),
        estimatedMaterialsCost: z.number().optional(),
        materialType: z.enum(['lumpsum', 'itemized']).optional(),
        // NO quantity
      })
    )
    .mutation(async ({ ctx, input }) => { 
        const services = createServices(ctx);
        const { taskId, ...taskData } = input;
        return services.quote.updateTask({ taskId, taskData });
    }),
  */

  // Example placeholder if deleteTask was meant to be standalone:
  /*
  deleteTask: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() })) // NO userId
    .mutation(async ({ ctx, input }) => {
        const services = createServices(ctx);
        return services.quote.deleteTask({ taskId: input.taskId });
     }),
  */

  // Example placeholder if addMaterial was meant to be standalone:
  /*
  addMaterial: protectedProcedure
    .input(
      z.object({
          taskId: z.string().uuid(),
          productId: z.string().uuid(),
          quantity: z.number(),
          unitPrice: z.number(),
          notes: z.string().optional().nullable(),
          // NO name, NO description
      })
    )
    .mutation(async ({ ctx, input }) => { 
      const services = createServices(ctx);
      const { taskId, ...materialData } = input;
      return services.quote.addMaterial({ taskId, materialData });
    }),
  */
});
