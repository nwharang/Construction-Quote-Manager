import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { tasks, quotes } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { type InferInsertModel } from "drizzle-orm";

// Define the insert type for the tasks table
type InsertTask = InferInsertModel<typeof tasks>;

export const taskRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        quoteId: z.string(),
        description: z.string(),
        price: z.number().min(0),
        estimatedMaterialsCost: z.number().min(0).optional(),
        order: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if quote belongs to user
        const quote = await ctx.db.query.quotes.findFirst({
          where: and(
            eq(quotes.id, input.quoteId),
            eq(quotes.userId, ctx.session.user.id)
          ),
        });

        if (!quote) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to add tasks to this quote",
          });
        }

        // Create the task
        const [task] = await ctx.db
          .insert(tasks)
          .values({
            id: crypto.randomUUID(),
            quoteId: input.quoteId,
            description: input.description,
            price: input.price.toString(),
            estimatedMaterialsCost: input.estimatedMaterialsCost?.toString() ?? "0",
            order: input.order ?? 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        if (!task) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create task',
          });
        }

        return { id: task.id };
      } catch (error) {
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
        id: z.string(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        estimatedMaterialsCost: z.number().min(0).optional(),
        order: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First, get the task to verify ownership
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

        // Check if quote belongs to user
        if (task.quote.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to modify this task",
          });
        }

        // Prepare update data
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

        // Update the task
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

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update task',
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // First, get the task to verify ownership
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

        // Check if quote belongs to user
        if (task.quote.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to delete this task",
          });
        }

        // Delete the task
        const [deletedTask] = await ctx.db
          .delete(tasks)
          .where(eq(tasks.id, input.id))
          .returning();

        if (!deletedTask) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete task',
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete task',
          cause: error,
        });
      }
    }),
}); 