import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { quotes, tasks, materials, QuoteStatus } from '~/server/db/schema';
import { and, eq, ilike, or, sql, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { type InferInsertModel } from 'drizzle-orm';

// Define the insert type for the quotes table
type InsertQuote = InferInsertModel<typeof quotes>;

const getAllInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  statuses: z.array(z.nativeEnum(QuoteStatus)).optional(),
});

export const quoteRouter = createTRPCRouter({
  getAll: protectedProcedure.input(getAllInput).query(async ({ ctx, input }) => {
    try {
      const { page, limit, search, statuses } = input;
      const skip = (page - 1) * limit;

      const where = and(
        eq(quotes.userId, ctx.session.user.id),
        ...(search
          ? [
              or(
                ilike(quotes.title, `%${search}%`),
                ilike(quotes.customerName, `%${search}%`),
                ilike(quotes.customerEmail, `%${search}%`)
              ),
            ]
          : []),
        ...(statuses && statuses.length > 0 ? [sql`${quotes.status} = ANY(${statuses})`] : [])
      );

      const [items, total] = await Promise.all([
        ctx.db
          .select()
          .from(quotes)
          .where(where)
          .limit(limit)
          .offset(skip)
          .orderBy(quotes.createdAt),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(quotes)
          .where(where)
          .then((result) => Number(result[0]?.count ?? 0)),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch quotes',
        cause: error,
      });
    }
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    try {
      const quote = await ctx.db.query.quotes.findFirst({
        where: and(eq(quotes.id, input.id), eq(quotes.userId, ctx.session.user.id)),
        with: {
          tasks: {
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found',
        });
      }

      return quote;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch quote',
        cause: error,
      });
    }
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        customerName: z.string(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [quote] = await ctx.db
          .insert(quotes)
          .values({
            id: crypto.randomUUID(),
            title: input.title,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            status: QuoteStatus.DRAFT,
            subtotalTasks: '0',
            subtotalMaterials: '0',
            complexityCharge: '0',
            markupCharge: '0',
            grandTotal: '0',
            notes: input.notes,
            userId: ctx.session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        if (!quote) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create quote',
          });
        }

        return { id: quote.id };
      } catch (error) {
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
        id: z.string(),
        title: z.string().optional(),
        customerName: z.string().optional(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        status: z
          .enum([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED])
          .optional(),
        subtotalTasks: z.number().min(0).optional(),
        subtotalMaterials: z.number().min(0).optional(),
        complexityCharge: z.number().min(0).optional(),
        markupCharge: z.number().min(0).optional(),
        grandTotal: z.number().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First, get the quote to verify ownership
        const existingQuote = await ctx.db.query.quotes.findFirst({
          where: and(eq(quotes.id, input.id), eq(quotes.userId, ctx.session.user.id)),
        });

        if (!existingQuote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }

        // Prepare update data
        const updateData: Partial<InsertQuote> = {
          updatedAt: new Date(),
        };

        if (input.title !== undefined) {
          updateData.title = input.title;
        }

        if (input.customerName !== undefined) {
          updateData.customerName = input.customerName;
        }

        if (input.customerEmail !== undefined) {
          updateData.customerEmail = input.customerEmail;
        }

        if (input.customerPhone !== undefined) {
          updateData.customerPhone = input.customerPhone;
        }

        if (input.status !== undefined) {
          updateData.status = input.status;
        }

        if (input.subtotalTasks !== undefined) {
          updateData.subtotalTasks = input.subtotalTasks.toString();
        }

        if (input.subtotalMaterials !== undefined) {
          updateData.subtotalMaterials = input.subtotalMaterials.toString();
        }

        if (input.complexityCharge !== undefined) {
          updateData.complexityCharge = input.complexityCharge.toString();
        }

        if (input.markupCharge !== undefined) {
          updateData.markupCharge = input.markupCharge.toString();
        }

        if (input.grandTotal !== undefined) {
          updateData.grandTotal = input.grandTotal.toString();
        }

        if (input.notes !== undefined) {
          updateData.notes = input.notes;
        }

        // Update the quote
        const [updatedQuote] = await ctx.db
          .update(quotes)
          .set(updateData)
          .where(eq(quotes.id, input.id))
          .returning();

        if (!updatedQuote) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update quote',
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update quote',
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // First, get the quote to verify ownership
        const quote = await ctx.db.query.quotes.findFirst({
          where: and(eq(quotes.id, input.id), eq(quotes.userId, ctx.session.user.id)),
        });

        if (!quote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }

        // Delete the quote
        const [deletedQuote] = await ctx.db
          .delete(quotes)
          .where(eq(quotes.id, input.id))
          .returning();

        if (!deletedQuote) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete quote',
          });
        }

        return { success: true };
      } catch (error) {
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
      // Get all stats in a single query
      const stats = await ctx.db
        .select({
          totalQuotes: sql<number>`count(*)`,
          acceptedQuotes: sql<number>`count(*) filter (where ${quotes.status} = ${QuoteStatus.ACCEPTED})`,
          totalCustomers: sql<number>`count(distinct ${quotes.customerName})`,
          totalRevenue: sql<string>`coalesce(sum(cast(${quotes.grandTotal} as numeric)) filter (where ${quotes.status} = ${QuoteStatus.ACCEPTED}), '0')`,
        })
        .from(quotes)
        .where(eq(quotes.userId, ctx.session.user.id));

      // Get recent quotes in a separate query for better performance
      const recentQuotes = await ctx.db
        .select()
        .from(quotes)
        .where(eq(quotes.userId, ctx.session.user.id))
        .orderBy(desc(quotes.createdAt))
        .limit(5);

      if (!stats[0]) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch dashboard stats',
        });
      }

      return {
        totalQuotes: Number(stats[0].totalQuotes ?? 0),
        acceptedQuotes: Number(stats[0].acceptedQuotes ?? 0),
        totalCustomers: Number(stats[0].totalCustomers ?? 0),
        totalRevenue: stats[0].totalRevenue ?? '0',
        recentQuotes,
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch dashboard stats',
        cause: error,
      });
    }
  }),
});
