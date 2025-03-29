import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { transactions, TransactionType, TransactionCategory } from '~/server/db/schema';
import { and, eq, sql, desc, gte, lte } from 'drizzle-orm';

const transactionInput = z.object({
  quoteId: z.string().optional(),
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  amount: z.number().min(0),
  description: z.string().optional(),
  date: z.date(),
});

const getAllInput = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  category: z.nativeEnum(TransactionCategory).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export const transactionRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(getAllInput)
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, type, category, page, limit } = input;
      const offset = (page - 1) * limit;

      // Build the where clause
      const conditions = [eq(transactions.userId, ctx.session.user.id)];
      if (startDate) {
        conditions.push(gte(transactions.date, startDate));
      }
      if (endDate) {
        conditions.push(lte(transactions.date, endDate));
      }
      if (type) {
        conditions.push(eq(transactions.type, type));
      }
      if (category) {
        conditions.push(eq(transactions.category, category));
      }

      // Get total count
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(and(...conditions));

      const total = countResult[0]?.count ?? 0;

      // Get transactions
      const items = await ctx.db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.date))
        .limit(limit)
        .offset(offset);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, input.id),
            eq(transactions.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!transaction[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        });
      }

      return transaction[0];
    }),

  create: protectedProcedure
    .input(transactionInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const [transaction] = await ctx.db
          .insert(transactions)
          .values({
            ...input,
            amount: input.amount.toString(),
            userId: ctx.session.user.id,
          })
          .returning();

        return transaction;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create transaction',
        });
      }
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: transactionInput }))
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify ownership
      const existingTransaction = await ctx.db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, id),
            eq(transactions.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!existingTransaction[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        });
      }

      try {
        const [transaction] = await ctx.db
          .update(transactions)
          .set({
            ...data,
            amount: data.amount.toString(),
            updatedAt: new Date(),
          })
          .where(eq(transactions.id, id))
          .returning();

        return transaction;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update transaction',
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existingTransaction = await ctx.db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, input.id),
            eq(transactions.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!existingTransaction[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        });
      }

      try {
        await ctx.db.delete(transactions).where(eq(transactions.id, input.id));
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete transaction',
        });
      }
    }),

  getFinancialReport: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { startDate, endDate } = input;

        // Get total income and expenses
        const totals = await ctx.db
          .select({
            totalIncome: sql<number>`coalesce(sum(case when ${transactions.type} = ${TransactionType.INCOME} then ${transactions.amount} else 0 end), 0)`,
            totalExpenses: sql<number>`coalesce(sum(case when ${transactions.type} = ${TransactionType.EXPENSE} then ${transactions.amount} else 0 end), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, ctx.session.user.id),
              gte(transactions.date, startDate),
              lte(transactions.date, endDate)
            )
          );

        // Get expenses by category
        const expensesByCategory = await ctx.db
          .select({
            category: transactions.category,
            total: sql<number>`sum(${transactions.amount})`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, ctx.session.user.id),
              eq(transactions.type, TransactionType.EXPENSE),
              gte(transactions.date, startDate),
              lte(transactions.date, endDate)
            )
          )
          .groupBy(transactions.category);

        // Get monthly breakdown
        const monthlyBreakdown = await ctx.db
          .select({
            month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
            income: sql<number>`coalesce(sum(case when ${transactions.type} = ${TransactionType.INCOME} then ${transactions.amount} else 0 end), 0)`,
            expenses: sql<number>`coalesce(sum(case when ${transactions.type} = ${TransactionType.EXPENSE} then ${transactions.amount} else 0 end), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, ctx.session.user.id),
              gte(transactions.date, startDate),
              lte(transactions.date, endDate)
            )
          )
          .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
          .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`);

        return {
          totals: {
            income: Number(totals[0]?.totalIncome ?? 0),
            expenses: Number(totals[0]?.totalExpenses ?? 0),
            net: Number(totals[0]?.totalIncome ?? 0) - Number(totals[0]?.totalExpenses ?? 0),
          },
          expensesByCategory,
          monthlyBreakdown,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate financial report',
          cause: error,
        });
      }
    }),
}); 