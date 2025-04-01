import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { tasks, quotes } from '~/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { type InferInsertModel } from 'drizzle-orm';

// Define the insert type for the tasks table
type InsertTask = InferInsertModel<typeof tasks>;

export const taskRouter = createTRPCRouter({
  getByQuoteId: protectedProcedure
    .input(z.object({ quoteId: z.string().uuid('Invalid quote ID format') }))
    .query(async ({ ctx, input }) => {
      try {
        // 1. Verify quote exists and belongs to user
        const quote = await ctx.db.query.quotes.findFirst({
          where: and(
            eq(quotes.id, input.quoteId), 
            eq(quotes.userId, ctx.session.user.id)
          ),
        });

        if (!quote) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "Quote not found or you don't have permission to view its tasks",
          });
        }

        // 2. Get tasks for the quote with materials included
        const taskList = await ctx.db.query.tasks.findMany({
          where: eq(tasks.quoteId, input.quoteId),
          with: {
            materials: true,
          },
          orderBy: tasks.order,
        });

        // 3. Convert string values to numbers for client consumption
        return taskList.map((task) => {
          return {
            ...task,
            price: parseFloat(task.price.toString()),
            estimatedMaterialsCost: parseFloat(task.estimatedMaterialsCost.toString()),
            materials: task.materials.map((material) => ({
              ...material,
              unitPrice: parseFloat(material.unitPrice.toString()),
            })),
          };
        });
      } catch (error) {
        console.error("Error fetching tasks:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch tasks',
          cause: error,
        });
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        quoteId: z.string().uuid('Invalid quote ID format'),
        description: z.string().min(1, 'Description is required'),
        price: z.number().min(0, 'Price must be a non-negative number'),
        estimatedMaterialsCost: z.number().min(0, 'Estimated materials cost must be a non-negative number').optional(),
        order: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Verify quote exists and belongs to user
        const quote = await ctx.db.query.quotes.findFirst({
          where: and(
            eq(quotes.id, input.quoteId), 
            eq(quotes.userId, ctx.session.user.id)
          ),
        });

        if (!quote) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "Quote not found or you don't have permission to add tasks to it",
          });
        }

        // 2. Create the task
        const [createdTask] = await ctx.db
          .insert(tasks)
          .values({
            id: crypto.randomUUID(),
            quoteId: input.quoteId,
            description: input.description,
            price: input.price.toString(),
            estimatedMaterialsCost: input.estimatedMaterialsCost?.toString() ?? '0',
            order: input.order ?? 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        if (!createdTask) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create task',
          });
        }

        return createdTask;
      } catch (error) {
        console.error("Error creating task:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create task',
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('Invalid task ID format'),
        description: z.string().min(1, 'Description is required').optional(),
        price: z.number().min(0, 'Price must be a non-negative number').optional(),
        estimatedMaterialsCost: z.number().min(0, 'Estimated materials cost must be a non-negative number').optional(),
        order: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Verify task exists and belongs to user
        const task = await ctx.db.query.tasks.findFirst({
          where: eq(tasks.id, input.id),
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
            message: "You don't have permission to modify this task",
          });
        }

        // 3. Prepare update data
        const updateData: Partial<InsertTask> = {
          updatedAt: new Date(),
        };

        if (input.description !== undefined) {
          updateData.description = input.description;
        }

        if (input.price !== undefined) {
          updateData.price = input.price.toString();
        }

        if (input.estimatedMaterialsCost !== undefined) {
          updateData.estimatedMaterialsCost = input.estimatedMaterialsCost.toString();
        }

        if (input.order !== undefined) {
          updateData.order = input.order;
        }

        // 4. Update the task
        const [updatedTask] = await ctx.db
          .update(tasks)
          .set(updateData)
          .where(eq(tasks.id, input.id))
          .returning();

        if (!updatedTask) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update task',
          });
        }

        return updatedTask;
      } catch (error) {
        console.error("Error updating task:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update task',
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid('Invalid task ID format') }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Verify task exists and belongs to user
        const task = await ctx.db.query.tasks.findFirst({
          where: eq(tasks.id, input.id),
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
            message: "You don't have permission to delete this task",
          });
        }

        // 3. Delete the task
        await ctx.db
          .delete(tasks)
          .where(eq(tasks.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("Error deleting task:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete task',
          cause: error,
        });
      }
    }),
});
