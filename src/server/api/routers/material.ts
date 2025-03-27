import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { materials, tasks, quotes } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const materialRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      name: z.string(),
      cost: z.number().min(0),
      quantity: z.number().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // First, get the task to verify ownership chain
      const task = await ctx.db.select().from(tasks)
        .where(eq(tasks.id, input.taskId));
      
      if (!task.length) {
        throw new Error("Task not found");
      }
      
      // Check if quote belongs to user
      const quote = await ctx.db.select().from(quotes)
        .where(eq(quotes.id, task[0].quoteId))
        .where(eq(quotes.createdBy, ctx.session.user.id));
      
      if (!quote.length) {
        throw new Error("You don't have permission to add materials to this task");
      }

      const id = uuidv4();
      
      await ctx.db.insert(materials).values({
        id,
        taskId: input.taskId,
        name: input.name,
        cost: input.cost,
        quantity: input.quantity,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      cost: z.number().min(0).optional(),
      quantity: z.number().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // First, get the material to verify ownership chain
      const material = await ctx.db.select().from(materials)
        .where(eq(materials.id, input.id));
      
      if (!material.length) {
        throw new Error("Material not found");
      }
      
      // Check task
      const task = await ctx.db.select().from(tasks)
        .where(eq(tasks.id, material[0].taskId));
      
      if (!task.length) {
        throw new Error("Associated task not found");
      }
      
      // Check if quote belongs to user
      const quote = await ctx.db.select().from(quotes)
        .where(eq(quotes.id, task[0].quoteId))
        .where(eq(quotes.createdBy, ctx.session.user.id));
      
      if (!quote.length) {
        throw new Error("You don't have permission to modify this material");
      }

      const updateData = {
        updatedAt: new Date(),
      } as Record<string, unknown>;

      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      
      if (input.cost !== undefined) {
        updateData.cost = input.cost;
      }
      
      if (input.quantity !== undefined) {
        updateData.quantity = input.quantity;
      }
      
      await ctx.db.update(materials)
        .set(updateData)
        .where(eq(materials.id, input.id));
      
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First, get the material to verify ownership chain
      const material = await ctx.db.select().from(materials)
        .where(eq(materials.id, input.id));
      
      if (!material.length) {
        throw new Error("Material not found");
      }
      
      // Check task
      const task = await ctx.db.select().from(tasks)
        .where(eq(tasks.id, material[0].taskId));
      
      if (!task.length) {
        throw new Error("Associated task not found");
      }
      
      // Check if quote belongs to user
      const quote = await ctx.db.select().from(quotes)
        .where(eq(quotes.id, task[0].quoteId))
        .where(eq(quotes.createdBy, ctx.session.user.id));
      
      if (!quote.length) {
        throw new Error("You don't have permission to delete this material");
      }

      // Delete the material
      await ctx.db.delete(materials)
        .where(eq(materials.id, input.id));
      
      return { success: true };
    }),
}); 