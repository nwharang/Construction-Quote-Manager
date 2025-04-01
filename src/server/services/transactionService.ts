import { TRPCError } from '@trpc/server';
import { and, eq, sql, desc, gte, lte } from 'drizzle-orm';
import { transactions, TransactionType, TransactionCategory, type TransactionTypeType, type TransactionCategoryType } from '../db/schema';
import { type DB, toNumber } from './index';

/**
 * Service layer for handling transaction-related business logic
 */
export class TransactionService {
  constructor(private db: DB) {}

  /**
   * Get all transactions with filtering and pagination
   */
  async getAllTransactions({
    userId,
    startDate,
    endDate,
    type,
    category,
    page,
    limit,
  }: {
    userId: string;
    startDate?: Date;
    endDate?: Date;
    type?: TransactionTypeType;
    category?: TransactionCategoryType;
    page: number;
    limit: number;
  }) {
    const offset = (page - 1) * limit;

    // Build the where clause with filters
    const conditions = [eq(transactions.userId, userId)];
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

    // Get total count of matching transactions
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count ?? 0);

    // Get transactions with pagination
    const items = await this.db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);

    // Convert numeric string values to numbers for client consumption
    const processedItems = items.map((item: any) => this.processTransaction(item));

    // Return paginated results with metadata
    return {
      items: processedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a transaction by ID
   */
  async getTransactionById({
    id,
    userId,
  }: {
    id: string;
    userId: string;
  }) {
    const transaction = await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.userId, userId)
        )
      )
      .limit(1);

    if (!transaction[0]) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Transaction not found or does not belong to user',
      });
    }

    return this.processTransaction(transaction[0]);
  }

  /**
   * Create a new transaction
   */
  async createTransaction({
    data,
    userId,
  }: {
    data: {
      quoteId?: string;
      type: TransactionTypeType;
      category: TransactionCategoryType;
      amount: number;
      description?: string;
      date: Date;
    };
    userId: string;
  }) {
    const [transaction] = await this.db
      .insert(transactions)
      .values({
        ...data,
        amount: data.amount.toString(), // Store as string in DB
        userId,
      })
      .returning();

    if (!transaction) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create transaction',
      });
    }

    return this.processTransaction(transaction);
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction({
    id,
    data,
    userId,
  }: {
    id: string;
    data: {
      quoteId?: string;
      type: TransactionTypeType;
      category: TransactionCategoryType;
      amount: number;
      description?: string;
      date: Date;
    };
    userId: string;
  }) {
    // Verify transaction exists and belongs to user
    await this.getTransactionById({ id, userId });

    const [updatedTransaction] = await this.db
      .update(transactions)
      .set({
        ...data,
        amount: data.amount.toString(), // Store as string in DB
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id))
      .returning();

    if (!updatedTransaction) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update transaction',
      });
    }

    return this.processTransaction(updatedTransaction);
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction({
    id,
    userId,
  }: {
    id: string;
    userId: string;
  }) {
    // Verify transaction exists and belongs to user
    await this.getTransactionById({ id, userId });

    await this.db
      .delete(transactions)
      .where(eq(transactions.id, id));

    return { success: true };
  }

  /**
   * Get financial report data
   */
  async getFinancialReport({
    startDate,
    endDate,
    userId,
  }: {
    startDate: Date;
    endDate: Date;
    userId: string;
  }) {
    // Get total income and expenses
    const totals = await this.db
      .select({
        totalIncome: sql<string>`coalesce(sum(case when ${transactions.type} = ${TransactionType.INCOME} then ${transactions.amount} else 0 end), 0)`,
        totalExpenses: sql<string>`coalesce(sum(case when ${transactions.type} = ${TransactionType.EXPENSE} then ${transactions.amount} else 0 end), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    // Get expenses by category
    const expensesByCategory = await this.db
      .select({
        category: transactions.category,
        total: sql<string>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, TransactionType.EXPENSE),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.category);

    // Get monthly breakdown
    const monthlyBreakdown = await this.db
      .select({
        month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
        income: sql<string>`coalesce(sum(case when ${transactions.type} = ${TransactionType.INCOME} then ${transactions.amount} else 0 end), 0)`,
        expenses: sql<string>`coalesce(sum(case when ${transactions.type} = ${TransactionType.EXPENSE} then ${transactions.amount} else 0 end), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`);

    // Process numeric strings to numbers for client consumption
    const processedTotals = {
      totalIncome: parseFloat(totals[0]?.totalIncome || '0'),
      totalExpenses: parseFloat(totals[0]?.totalExpenses || '0'),
    };

    const processedExpensesByCategory = expensesByCategory.map((item: any) => ({
      category: item.category,
      total: parseFloat(item.total || '0'),
    }));

    const processedMonthlyBreakdown = monthlyBreakdown.map((item: any) => ({
      month: item.month,
      income: parseFloat(item.income || '0'),
      expenses: parseFloat(item.expenses || '0'),
      balance: parseFloat(item.income || '0') - parseFloat(item.expenses || '0'),
    }));

    // Return compiled financial report
    return {
      totals: processedTotals,
      expensesByCategory: processedExpensesByCategory,
      monthlyBreakdown: processedMonthlyBreakdown,
      netProfit: processedTotals.totalIncome - processedTotals.totalExpenses,
    };
  }

  /**
   * Helper function to convert string numeric values to actual numbers
   */
  private processTransaction(transactionData: any) {
    return {
      ...transactionData,
      amount: toNumber(transactionData.amount),
    };
  }
} 