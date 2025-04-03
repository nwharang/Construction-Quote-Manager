import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { TransactionType, TransactionCategory } from '~/server/db/schema';
import { createServices } from '~/server/services';

// Input schema for creating/updating transactions
const transactionInput = z.object({
  quoteId: z.string().optional(),
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  amount: z.number().min(0, 'Amount must be non-negative'),
  description: z.string().optional(),
  date: z.date(),
});

// Input schema for listing transactions with filtering
const getAllInput = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  category: z.nativeEnum(TransactionCategory).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export const transactionRouter = createTRPCRouter({
  getAll: protectedProcedure.input(getAllInput).query(async ({ ctx, input }) => {
    try {
      const services = createServices(ctx);
      const userId = ctx.session.user.id;

      const result = await services.transaction.getAllTransactions({
        userId: userId,
        ...input,
      });

      return result;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch transactions',
        cause: error,
      });
    }
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid('Invalid transaction ID format') }))
    .query(async ({ ctx, input }) => {
      try {
        const services = createServices(ctx);
        const userId = ctx.session.user.id;

        const transaction = await services.transaction.getTransactionById({
          id: input.id,
          userId: userId,
        });

        return transaction;
      } catch (error) {
        console.error('Error fetching transaction:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch transaction',
          cause: error,
        });
      }
    }),

  create: protectedProcedure.input(transactionInput).mutation(async ({ ctx, input }) => {
    try {
      const services = createServices(ctx);
      const userId = ctx.session.user.id;

      const transaction = await services.transaction.createTransaction({
        data: input,
        userId: userId,
      });

      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create transaction',
        cause: error,
      });
    }
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('Invalid transaction ID format'),
        data: transactionInput,
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const services = createServices(ctx);
        const userId = ctx.session.user.id;

        const updatedTransaction = await services.transaction.updateTransaction({
          id: input.id,
          data: input.data,
          userId: userId,
        });

        return updatedTransaction;
      } catch (error) {
        console.error('Error updating transaction:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update transaction',
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid('Invalid transaction ID format') }))
    .mutation(async ({ ctx, input }) => {
      try {
        const services = createServices(ctx);
        const userId = ctx.session.user.id;

        const result = await services.transaction.deleteTransaction({
          id: input.id,
          userId: userId,
        });

        return result;
      } catch (error) {
        console.error('Error deleting transaction:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete transaction',
          cause: error,
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
        const services = createServices(ctx);
        const userId = ctx.session.user.id;

        const report = await services.transaction.getFinancialReport({
          startDate: input.startDate,
          endDate: input.endDate,
          userId: userId,
        });

        return report;
      } catch (error) {
        console.error('Error generating financial report:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate financial report',
          cause: error,
        });
      }
    }),
});
