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
        taskId: z.string().uuid('Invalid task ID format'),
        productId: z.string().min(1, 'Product ID is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        unitPrice: z.number().min(0, 'Unit price must be a non-negative number'),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Verify task exists and belongs to user through quote ownership
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

        // 2. Check if quote belongs to user
        if (task.quote.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to add materials to this task",
          });
        }

        // 3. Verify product exists
        const product = await ctx.db.query.products.findFirst({
          where: eq(products.id, input.productId),
        });

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found',
          });
        }

        // 4. Create the material with proper handling of numeric values
        const [createdMaterial] = await ctx.db
          .insert(materials)
          .values({
            id: crypto.randomUUID(),
            taskId: input.taskId,
            productId: input.productId,
            quantity: input.quantity,
            unitPrice: input.unitPrice.toString(), // Store as string in DB
            notes: input.notes,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        if (!createdMaterial) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create material',
          });
        }

        // 5. Return with numeric values for client consumption
        return { 
          ...createdMaterial,
          unitPrice: parseFloat(createdMaterial.unitPrice.toString()),
          quoteId: task.quote.id 
        };
      } catch (error) {
        console.error("Error creating material:", error);
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
        id: z.string().uuid('Invalid material ID format'),
        quantity: z.number().min(1, 'Quantity must be at least 1').optional(),
        unitPrice: z.number().min(0, 'Unit price must be a non-negative number').optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Verify material exists and belongs to user through task and quote ownership
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

        // 2. Check if quote belongs to user
        if (material.task.quote.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to modify this material",
          });
        }

        // 3. Prepare update data
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

        // 4. Update the material
        const [updatedMaterial] = await ctx.db
          .update(materials)
          .set(updateData)
          .where(eq(materials.id, input.id))
          .returning();

        if (!updatedMaterial) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update material',
          });
        }

        // 5. Return updated material with quote ID for client reference
        return {
          ...updatedMaterial,
          unitPrice: parseFloat(updatedMaterial.unitPrice.toString()),
          quoteId: material.task.quote.id
        };
      } catch (error) {
        console.error("Error updating material:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update material',
          cause: error,
        });
      }
    }),

  getByTaskId: protectedProcedure
    .input(z.object({ taskId: z.string().uuid('Invalid task ID format') }))
    .query(async ({ ctx, input }) => {
      try {
        // 1. Verify task exists and belongs to user through quote ownership
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

        // 2. Check if quote belongs to user
        if (task.quote.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to view these materials",
          });
        }

        // 3. Get materials with product info
        const taskMaterials = await ctx.db.query.materials.findMany({
          where: eq(materials.taskId, input.taskId),
          with: {
            product: true,
          },
        });

        // 4. Convert string values to numbers for client consumption
        return taskMaterials.map((material) => ({
          ...material,
          unitPrice: parseFloat(material.unitPrice.toString()),
        }));
      } catch (error) {
        console.error("Error fetching materials:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch materials',
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid('Invalid material ID format') }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Verify material exists and belongs to user through task and quote ownership
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

        // 2. Check if quote belongs to user
        if (material.task.quote.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to delete this material",
          });
        }

        // 3. Delete the material
        await ctx.db
          .delete(materials)
          .where(eq(materials.id, input.id));

        // 4. Return success with quote ID for client reference
        return { 
          success: true, 
          quoteId: material.task.quote.id 
        };
      } catch (error) {
        console.error("Error deleting material:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete material',
          cause: error,
        });
      }
    }),
});
