import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { tasks } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { type InferInsertModel } from "drizzle-orm";

// Define the insert type for the tasks table
type InsertTask = InferInsertModel<typeof tasks>;

export const taskRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
      description: z.string(),
      price: z.number().min(0),
      estimatedMaterialsCost: z.number().min(0).optional(),
      order: z.number().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Map the input to the database schema field names
        const taskToInsert: InsertTask = {
          quote_id: input.quoteId,
          description: input.description,
          price: input.price.toString(),
          estimated_materials_cost: (input.estimatedMaterialsCost ?? 0).toString(),
          order: input.order ?? 0,
        };

        // Insert the task
        const result = await ctx.db.insert(tasks).values(taskToInsert).returning();
        
        if (!result.length) {
          throw new Error("Failed to create task");
        }
        
        return { id: result[0].id };
      } catch (error) {
        console.error("Error creating task:", error);
        throw new Error("Failed to create task. Make sure the quote exists and you have permission.");
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      description: z.string().optional(),
      price: z.number().min(0).optional(),
      estimatedMaterialsCost: z.number().min(0).optional(),
      order: z.number().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Create an update object with only the fields that are provided
        const updateData: Partial<InsertTask> = {};
        
        if (input.description !== undefined) {
          updateData.description = input.description;
        }
        
        if (input.price !== undefined) {
          updateData.price = input.price.toString();
        }
        
        if (input.estimatedMaterialsCost !== undefined) {
          updateData.estimated_materials_cost = input.estimatedMaterialsCost.toString();
        }
        
        if (input.order !== undefined) {
          updateData.order = input.order;
        }
        
        // Only update if we have data to update
        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date();
          await ctx.db.update(tasks).set(updateData).where(eq(tasks.id, input.id));
        }
        
        return { success: true };
      } catch (error) {
        console.error("Error updating task:", error);
        throw new Error("Failed to update task. Make sure the task exists and you have permission.");
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Delete the task
        await ctx.db.delete(tasks).where(eq(tasks.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("Error deleting task:", error);
        throw new Error("Failed to delete task. Make sure the task exists and you have permission.");
      }
    }),
}); 