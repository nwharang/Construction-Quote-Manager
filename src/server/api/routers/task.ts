import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { tasks, quotes } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

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
      // First, verify the quote belongs to the user
      const quote = await ctx.db.select().from(quotes)
        .where(eq(quotes.id, input.quoteId))
        .where(eq(quotes.createdBy, ctx.session.user.id));
      
      if (!quote.length) {
        throw new Error("Quote not found or you don't have permission to modify it");
      }

      const id = uuidv4();
      
      await ctx.db.insert(tasks).values({
        id,
        quoteId: input.quoteId,
        description: input.description,
        price: input.price,
        estimatedMaterialsCost: input.estimatedMaterialsCost ?? 0,
        order: input.order ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { id };
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
      // First, get the task to verify quote ownership
      const task = await ctx.db.select().from(tasks)
        .where(eq(tasks.id, input.id));
      
      if (!task.length) {
        throw new Error("Task not found");
      }
      
      // Check if quote belongs to user
      const quote = await ctx.db.select().from(quotes)
        .where(eq(quotes.id, task[0].quoteId))
        .where(eq(quotes.createdBy, ctx.session.user.id));
      
      if (!quote.length) {
        throw new Error("You don't have permission to modify this task");
      }

      const updateData = {
        updatedAt: new Date(),
      } as Record<string, unknown>;

      if (input.description !== undefined) {
        updateData.description = input.description;
      }
      
      if (input.price !== undefined) {
        updateData.price = input.price;
      }
      
      if (input.estimatedMaterialsCost !== undefined) {
        updateData.estimatedMaterialsCost = input.estimatedMaterialsCost;
      }
      
      if (input.order !== undefined) {
        updateData.order = input.order;
      }
      
      await ctx.db.update(tasks)
        .set(updateData)
        .where(eq(tasks.id, input.id));
      
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First, get the task to verify quote ownership
      const task = await ctx.db.select().from(tasks)
        .where(eq(tasks.id, input.id));
      
      if (!task.length) {
        throw new Error("Task not found");
      }
      
      // Check if quote belongs to user
      const quote = await ctx.db.select().from(quotes)
        .where(eq(quotes.id, task[0].quoteId))
        .where(eq(quotes.createdBy, ctx.session.user.id));
      
      if (!quote.length) {
        throw new Error("You don't have permission to delete this task");
      }

      // Delete the task
      await ctx.db.delete(tasks)
        .where(eq(tasks.id, input.id));
      
      return { success: true };
    }),
}); 