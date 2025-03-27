import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { quotes, quoteTasks, quoteMaterials, products } from "~/server/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Input schemas
const createQuoteSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

const createTaskSchema = z.object({
  quoteId: z.string().uuid(),
  description: z.string().min(1, "Description is required"),
  taskPrice: z.number().min(0, "Task price must be positive"),
  estimatedMaterialsCostLumpSum: z.number().min(0).optional(),
  order: z.number().int().min(0),
});

const createMaterialSchema = z.object({
  quoteTaskId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  quantity: z.number().min(0, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
});

export const quotesRouter = createTRPCRouter({
  // List all quotes for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.quotes.findMany({
      where: eq(quotes.createdBy, ctx.session.user.id),
      orderBy: [desc(quotes.createdAt)],
      with: {
        tasks: {
          orderBy: [desc(quoteTasks.order)],
          with: {
            materials: true,
          },
        },
      },
    });
  }),

  // Get a single quote by ID
  getById: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const quote = await ctx.db.query.quotes.findFirst({
        where: and(
          eq(quotes.id, input),
          eq(quotes.createdBy, ctx.session.user.id)
        ),
        with: {
          tasks: {
            orderBy: [desc(quoteTasks.order)],
            with: {
              materials: {
                with: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!quote) {
        throw new Error("Quote not found");
      }

      return quote;
    }),

  // Create a new quote
  create: protectedProcedure
    .input(createQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      const [quote] = await ctx.db
        .insert(quotes)
        .values({
          ...input,
          createdBy: ctx.session.user.id,
        })
        .returning();

      return quote;
    }),

  // Add a task to a quote
  addTask: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify quote ownership
      const quote = await ctx.db.query.quotes.findFirst({
        where: and(
          eq(quotes.id, input.quoteId),
          eq(quotes.createdBy, ctx.session.user.id)
        ),
      });

      if (!quote) {
        throw new Error("Quote not found");
      }

      const [task] = await ctx.db
        .insert(quoteTasks)
        .values(input)
        .returning();

      // Update quote totals
      await updateQuoteTotals(ctx.db, input.quoteId);

      return task;
    }),

  // Add material to a task
  addMaterial: protectedProcedure
    .input(createMaterialSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify task ownership through quote
      const task = await ctx.db.query.quoteTasks.findFirst({
        where: eq(quoteTasks.id, input.quoteTaskId),
        with: {
          quote: true,
        },
      });

      if (!task || task.quote.createdBy !== ctx.session.user.id) {
        throw new Error("Task not found");
      }

      const totalPrice = input.quantity * input.unitPrice;

      const [material] = await ctx.db
        .insert(quoteMaterials)
        .values({
          ...input,
          totalPrice,
        })
        .returning();

      // Update quote totals
      await updateQuoteTotals(ctx.db, task.quoteId);

      return material;
    }),

  // Update quote status
  updateStatus: protectedProcedure
    .input(
      z.object({
        quoteId: z.string().uuid(),
        status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [quote] = await ctx.db
        .update(quotes)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quotes.id, input.quoteId),
            eq(quotes.createdBy, ctx.session.user.id)
          )
        )
        .returning();

      if (!quote) {
        throw new Error("Quote not found");
      }

      return quote;
    }),

  // Update quote complexity and markup charges
  updateCharges: protectedProcedure
    .input(
      z.object({
        quoteId: z.string().uuid(),
        complexityCharge: z.number().min(0).max(100),
        markupCharge: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [quote] = await ctx.db
        .update(quotes)
        .set({
          complexityCharge: String(input.complexityCharge),
          markupCharge: String(input.markupCharge),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quotes.id, input.quoteId),
            eq(quotes.createdBy, ctx.session.user.id)
          )
        )
        .returning();

      if (!quote) {
        throw new Error("Quote not found");
      }

      // Recalculate totals with new charges
      await updateQuoteTotals(ctx.db, input.quoteId);

      return quote;
    }),

  // Delete a quote
  delete: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      const [quote] = await ctx.db
        .delete(quotes)
        .where(
          and(
            eq(quotes.id, input),
            eq(quotes.createdBy, ctx.session.user.id)
          )
        )
        .returning();

      if (!quote) {
        throw new Error("Quote not found");
      }

      return quote;
    }),
});

// Helper function to update quote totals
async function updateQuoteTotals(db: any, quoteId: string) {
  const tasks = await db.query.quoteTasks.findMany({
    where: eq(quoteTasks.quoteId, quoteId),
    with: {
      materials: true,
    },
  });

  const subtotalTasks = tasks.reduce((sum: number, task: any) => sum + Number(task.taskPrice), 0);
  const subtotalMaterials = tasks.reduce((sum: number, task: any) => {
    const taskMaterials = task.materials.reduce(
      (taskSum: number, material: any) => taskSum + Number(material.totalPrice),
      0
    );
    return sum + taskMaterials + (task.estimatedMaterialsCostLumpSum ? Number(task.estimatedMaterialsCostLumpSum) : 0);
  }, 0);

  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
  });

  const complexityCharge = (subtotalTasks + subtotalMaterials) * (Number(quote.complexityCharge) / 100);
  const markupCharge = (subtotalTasks + subtotalMaterials + complexityCharge) * (Number(quote.markupCharge) / 100);
  const grandTotal = subtotalTasks + subtotalMaterials + complexityCharge + markupCharge;

  await db
    .update(quotes)
    .set({
      subtotalTasks,
      subtotalMaterials,
      grandTotal,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, quoteId));
} 