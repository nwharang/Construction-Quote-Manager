import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { materials, tasks, quotes, products } from '~/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { type InferInsertModel } from 'drizzle-orm';

// Define the insert type for the materials table
type InsertMaterial = InferInsertModel<typeof materials>;

export const materialRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        productId: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First, get the task to verify ownership chain
        const task = await ctx.db.query.tasks.findFirst({
          where: eq(tasks.id, input.taskId),
          with: {
            quote: true,
          },
        });

        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          });
        }

        // Check if quote belongs to user
        if (task.quote.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to add materials to this task",
          });
        }

        // Verify product exists
        const product = await ctx.db.query.products.findFirst({
          where: eq(products.id, input.productId),
        });

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found',
          });
        }

        // Create the material
        const [material] = await ctx.db
          .insert(materials)
          .values({
            id: crypto.randomUUID(),
            taskId: input.taskId,
            productId: input.productId,
            quantity: input.quantity,
            unitPrice: input.unitPrice.toString(),
            notes: input.notes,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        if (!material) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create material',
          });
        }

        return material;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create material',
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        quantity: z.number().min(1).optional(),
        unitPrice: z.number().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First, get the material to verify ownership chain
        const material = await ctx.db.query.materials.findFirst({
          where: eq(materials.id, input.id),
          with: {
            task: {
              with: {
                quote: true,
              },
            },
          },
        });

        if (!material) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Material not found',
          });
        }

        // Check if quote belongs to user
        if (material.task.quote.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to modify this material",
          });
        }

        // Prepare update data
        const updateData: Partial<InsertMaterial> = {
          updatedAt: new Date(),
        };

        if (input.quantity !== undefined) {
          updateData.quantity = input.quantity;
        }

        if (input.unitPrice !== undefined) {
          updateData.unitPrice = input.unitPrice.toString();
        }

        if (input.notes !== undefined) {
          updateData.notes = input.notes;
        }

        // Update the material
        const [updatedMaterial] = await ctx.db
          .update(materials)
          .set(updateData)
          .where(eq(materials.id, input.id))
          .returning();

        return updatedMaterial;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update material',
          cause: error,
        });
      }
    }),

  getByTaskId: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // First verify task ownership
        const task = await ctx.db.query.tasks.findFirst({
          where: eq(tasks.id, input.taskId),
          with: {
            quote: true,
          },
        });

        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          });
        }

        if (task.quote.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to view these materials",
          });
        }

        // Get materials with product info
        const taskMaterials = await ctx.db.query.materials.findMany({
          where: eq(materials.taskId, input.taskId),
          with: {
            product: true,
          },
        });

        return taskMaterials;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch materials',
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // First, get the material to verify ownership chain
        const material = await ctx.db.query.materials.findFirst({
          where: eq(materials.id, input.id),
          with: {
            task: {
              with: {
                quote: true,
              },
            },
          },
        });

        if (!material) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Material not found',
          });
        }

        // Check if quote belongs to user
        if (material.task.quote.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to delete this material",
          });
        }

        // Delete the material
        await ctx.db
          .delete(materials)
          .where(eq(materials.id, input.id));

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete material',
          cause: error,
        });
      }
    }),
});
