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
  getAll: protectedProcedure
    .input(getAllInput)
    .query(async ({ ctx, input }) => {
      try {
        // 1. Get services
        const services = createServices();
        
        // 2. Get user ID from context
        const userId = ctx.session.user.id;
        
        // 3. Use service to fetch transactions
        const result = await services.transaction.getAllTransactions({
          userId,
          ...input,
        });
        
        // 4. Return result
        return result;
      } catch (error) {
        // 5. Handle errors
        console.error("Error fetching transactions:", error);
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
        // 1. Get services
        const services = createServices();
        
        // 2. Get user ID from context
        const userId = ctx.session.user.id;
        
        // 3. Use service to get transaction by ID
        const transaction = await services.transaction.getTransactionById({
          id: input.id,
          userId,
        });
        
        // 4. Return the transaction
        return transaction;
      } catch (error) {
        // 5. Handle errors
        console.error("Error fetching transaction:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch transaction',
          cause: error,
        });
      }
    }),

  create: protectedProcedure
    .input(transactionInput)
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Get services
        const services = createServices();
        
        // 2. Get user ID from context
        const userId = ctx.session.user.id;
        
        // 3. Use service to create transaction
        const transaction = await services.transaction.createTransaction({
          data: input,
          userId,
        });
        
        // 4. Return the created transaction
        return transaction;
      } catch (error) {
        // 5. Handle errors
        console.error("Error creating transaction:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create transaction',
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(z.object({ 
      id: z.string().uuid('Invalid transaction ID format'), 
      data: transactionInput 
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Get services
        const services = createServices();
        
        // 2. Get user ID from context
        const userId = ctx.session.user.id;
        
        // 3. Use service to update transaction
        const updatedTransaction = await services.transaction.updateTransaction({
          id: input.id,
          data: input.data,
          userId,
        });
        
        // 4. Return the updated transaction
        return updatedTransaction;
      } catch (error) {
        // 5. Handle errors
        console.error("Error updating transaction:", error);
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
        // 1. Get services
        const services = createServices();
        
        // 2. Get user ID from context
        const userId = ctx.session.user.id;
        
        // 3. Use service to delete transaction
        const result = await services.transaction.deleteTransaction({
          id: input.id,
          userId,
        });
        
        // 4. Return success response
        return result;
      } catch (error) {
        // 5. Handle errors
        console.error("Error deleting transaction:", error);
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
        // 1. Get services
        const services = createServices();
        
        // 2. Get user ID from context
        const userId = ctx.session.user.id;
        
        // 3. Use service to get financial report
        const report = await services.transaction.getFinancialReport({
          startDate: input.startDate,
          endDate: input.endDate,
          userId,
        });
        
        // 4. Return the financial report
        return report;
      } catch (error) {
        // 5. Handle errors
        console.error("Error generating financial report:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate financial report',
          cause: error,
        });
      }
    }),
}); 