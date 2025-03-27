import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { quotes, tasks, materials } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const quoteRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(quotes).where(eq(quotes.createdBy, ctx.session.user.id));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const quote = await ctx.db.select().from(quotes)
        .where(eq(quotes.id, input.id))
        .where(eq(quotes.createdBy, ctx.session.user.id));
      
      if (!quote.length) return null;

      const quoteTasks = await ctx.db.select().from(tasks)
        .where(eq(tasks.quoteId, input.id));
      
      const taskIds = quoteTasks.map(task => task.id);
      
      const taskMaterials = taskIds.length > 0 
        ? await ctx.db.select().from(materials)
          .where(eq(materials.taskId, taskIds[0]))
        : [];
      
      return {
        ...quote[0],
        tasks: quoteTasks.map(task => ({
          ...task,
          materials: taskMaterials.filter(material => material.taskId === task.id)
        }))
      };
    }),

  create: protectedProcedure
    .input(z.object({
      projectName: z.string(),
      customerName: z.string(),
      customerEmail: z.string().email().optional(),
      customerPhone: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = uuidv4();
      await ctx.db.insert(quotes).values({
        id,
        createdBy: ctx.session.user.id,
        projectName: input.projectName,
        customerName: input.customerName,
        customerEmail: input.customerEmail || null,
        customerPhone: input.customerPhone || null,
        notes: input.notes || null,
        status: "DRAFT",
        complexityCharge: 0,
        markupPercentage: 20, // Default 20% markup
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { id };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(quotes)
        .set({ 
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, input.id))
        .where(eq(quotes.createdBy, ctx.session.user.id));
      
      return { success: true };
    }),

  updateCharges: protectedProcedure
    .input(z.object({
      id: z.string(),
      complexityCharge: z.number().min(0),
      markupPercentage: z.number().min(0).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(quotes)
        .set({ 
          complexityCharge: input.complexityCharge,
          markupPercentage: input.markupPercentage,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, input.id))
        .where(eq(quotes.createdBy, ctx.session.user.id));
      
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Delete related tasks and materials first
      const quoteTasks = await ctx.db.select().from(tasks)
        .where(eq(tasks.quoteId, input.id));
      
      for (const task of quoteTasks) {
        await ctx.db.delete(materials)
          .where(eq(materials.taskId, task.id));
      }
      
      await ctx.db.delete(tasks)
        .where(eq(tasks.quoteId, input.id));
      
      await ctx.db.delete(quotes)
        .where(eq(quotes.id, input.id))
        .where(eq(quotes.createdBy, ctx.session.user.id));
      
      return { success: true };
    }),
}); 