import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { quotes, tasks, materials, QuoteStatus, customers } from '~/server/db/schema';
import { and, eq, ilike, or, sql, desc, type SQL } from 'drizzle-orm';
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
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z
          .enum([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED])
          .optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const offset = (input.page - 1) * input.limit;

        // Build the where clause
        let whereClause = eq(quotes.userId, ctx.session.user.id);
        
        if (input.search) {
          whereClause = and(
            whereClause,
            or(
              ilike(quotes.title, `%${input.search}%`),
              ilike(quotes.customerName, `%${input.search}%`),
              ilike(quotes.customerEmail, `%${input.search}%`)
            )
          );
        }
        
        if (input.status) {
          whereClause = and(whereClause, eq(quotes.status, input.status));
        }

        // Get total count
        const countResult = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(quotes)
          .where(whereClause);

        const total = countResult[0]?.count ?? 0;

        // Get quotes with customer information
        const quotesWithCustomers = await ctx.db
          .select({
            quote: quotes,
            customer: customers,
          })
          .from(quotes)
          .leftJoin(customers, eq(quotes.customerId, customers.id))
          .where(whereClause)
          .orderBy(desc(quotes.createdAt))
          .limit(input.limit)
          .offset(offset);

        return {
          quotes: quotesWithCustomers.map(({ quote, customer }) => ({
            ...quote,
            customer: customer || null,
          })),
          total,
          page: input.page,
          limit: input.limit,
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
      const quoteWithCustomer = await ctx.db
        .select({
          quote: quotes,
          customer: customers,
        })
        .from(quotes)
        .leftJoin(customers, eq(quotes.customerId, customers.id))
        .where(and(eq(quotes.id, input.id), eq(quotes.userId, ctx.session.user.id)))
        .limit(1);

      if (!quoteWithCustomer[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found',
        });
      }

      return {
        ...quoteWithCustomer[0].quote,
        customer: quoteWithCustomer[0].customer || null,
      };
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
        // First, try to find an existing customer
        const existingCustomer = await ctx.db
          .select()
          .from(customers)
          .where(
            and(eq(customers.userId, ctx.session.user.id), eq(customers.name, input.customerName))
          )
          .limit(1);

        let customerId: string;

        // If no customer found, create one
        if (!existingCustomer[0]) {
          const [newCustomer] = await ctx.db
            .insert(customers)
            .values({
              name: input.customerName,
              email: input.customerEmail,
              phone: input.customerPhone,
              userId: ctx.session.user.id,
            })
            .returning();

          if (!newCustomer) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create customer',
            });
          }

          customerId = newCustomer.id;
        } else {
          customerId = existingCustomer[0].id;
        }

        // Create the quote with the customer ID
        const [quote] = await ctx.db
          .insert(quotes)
          .values({
            id: crypto.randomUUID(),
            title: input.title,
            customerId,
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
        title: z.string(),
        customerName: z.string(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First, check if the quote exists and belongs to the user
        const existingQuote = await ctx.db
          .select()
          .from(quotes)
          .where(and(eq(quotes.id, input.id), eq(quotes.userId, ctx.session.user.id)))
          .limit(1);

        if (!existingQuote[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }

        // Try to find an existing customer
        const existingCustomer = await ctx.db
          .select()
          .from(customers)
          .where(
            and(eq(customers.userId, ctx.session.user.id), eq(customers.name, input.customerName))
          )
          .limit(1);

        let customerId: string;

        // If no customer found, create one
        if (!existingCustomer[0]) {
          const [newCustomer] = await ctx.db
            .insert(customers)
            .values({
              name: input.customerName,
              email: input.customerEmail,
              phone: input.customerPhone,
              userId: ctx.session.user.id,
            })
            .returning();

          if (!newCustomer) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create customer',
            });
          }

          customerId = newCustomer.id;
        } else {
          customerId = existingCustomer[0].id;
        }

        // Update the quote with the customer ID
        const [quote] = await ctx.db
          .update(quotes)
          .set({
            title: input.title,
            customerId,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            notes: input.notes,
            status: input.status,
            updatedAt: new Date(),
          })
          .where(and(eq(quotes.id, input.id), eq(quotes.userId, ctx.session.user.id)))
          .returning();

        if (!quote) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update quote',
          });
        }

        return quote;
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
        // First, check if the quote exists and belongs to the user
        const existingQuote = await ctx.db
          .select()
          .from(quotes)
          .where(and(eq(quotes.id, input.id), eq(quotes.userId, ctx.session.user.id)))
          .limit(1);

        if (!existingQuote[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }

        // Delete the quote
        const [deletedQuote] = await ctx.db
          .delete(quotes)
          .where(and(eq(quotes.id, input.id), eq(quotes.userId, ctx.session.user.id)))
          .returning();

        if (!deletedQuote) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete quote',
          });
        }

        // Check if this was the last quote for this customer
        const remainingQuotes = await ctx.db
          .select()
          .from(quotes)
          .where(eq(quotes.customerId, deletedQuote.customerId))
          .limit(1);

        // If no remaining quotes, delete the customer
        if (!remainingQuotes[0]) {
          await ctx.db.delete(customers).where(eq(customers.id, deletedQuote.customerId));
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
          totalCustomers: sql<number>`count(distinct ${quotes.customerId})`,
          totalRevenue: sql<string>`coalesce(sum(cast(${quotes.grandTotal} as numeric)) filter (where ${quotes.status} = ${QuoteStatus.ACCEPTED}), '0')`,
        })
        .from(quotes)
        .where(eq(quotes.userId, ctx.session.user.id));

      // Get recent quotes with customer information
      const recentQuotes = await ctx.db
        .select({
          quote: quotes,
          customer: customers,
        })
        .from(quotes)
        .leftJoin(customers, eq(quotes.customerId, customers.id))
        .where(eq(quotes.userId, ctx.session.user.id))
        .orderBy(desc(quotes.createdAt))
        .limit(5);

      // Get top customers by revenue
      const topCustomers = await ctx.db
        .select({
          customer: customers,
          totalRevenue: sql<string>`coalesce(sum(cast(${quotes.grandTotal} as numeric)) filter (where ${quotes.status} = ${QuoteStatus.ACCEPTED}), '0')`,
          quoteCount: sql<number>`count(*)`,
        })
        .from(quotes)
        .leftJoin(customers, eq(quotes.customerId, customers.id))
        .where(eq(quotes.userId, ctx.session.user.id))
        .groupBy(customers.id, customers.name, customers.email, customers.phone)
        .orderBy(
          sql`sum(cast(${quotes.grandTotal} as numeric)) filter (where ${quotes.status} = ${QuoteStatus.ACCEPTED}) desc`
        )
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
        recentQuotes: recentQuotes.map(({ quote, customer }) => ({
          ...quote,
          customer: customer || null,
        })),
        topCustomers: topCustomers.map(({ customer, totalRevenue, quoteCount }) => ({
          ...customer,
          totalRevenue: totalRevenue ?? '0',
          quoteCount: Number(quoteCount ?? 0),
        })),
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

  updateCharges: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        complexityCharge: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Calculate new grand total based on the quote data
        const quoteData = await ctx.db
          .select()
          .from(quotes)
          .where(
            and(
              eq(quotes.id, input.id), 
              eq(quotes.userId, ctx.session.user.id)
            )
          )
          .limit(1);
          
        if (!quoteData[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }
        
        // Get all tasks to calculate subtotals
        const quoteTasks = await ctx.db
          .select()
          .from(tasks)
          .where(eq(tasks.quoteId, input.id));
          
        // Calculate subtotals
        const subtotalTasks = quoteTasks.reduce((sum, task) => sum + Number(task.price), 0);
        const subtotalMaterials = quoteTasks.reduce((sum, task) => sum + Number(task.estimatedMaterialsCost), 0);
        const subtotal = subtotalTasks + subtotalMaterials;
        
        // Calculate grand total
        const complexityCharge = input.complexityCharge;
        const markup = (subtotal + complexityCharge) * (quoteData[0].markupPercentage / 100);
        const grandTotal = subtotal + complexityCharge + markup;
        
        // Update the quote
        const [updatedQuote] = await ctx.db
          .update(quotes)
          .set({
            complexityCharge: complexityCharge.toString(),
            subtotalTasks: subtotalTasks.toString(),
            subtotalMaterials: subtotalMaterials.toString(),
            markupCharge: markup.toString(),
            grandTotal: grandTotal.toString(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(quotes.id, input.id), 
              eq(quotes.userId, ctx.session.user.id)
            )
          )
          .returning();
          
        if (!updatedQuote) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update quote charges',
          });
        }
        
        return updatedQuote;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update quote charges',
          cause: error,
        });
      }
    }),
    
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if the quote exists and belongs to the user
        const existingQuote = await ctx.db
          .select()
          .from(quotes)
          .where(
            and(
              eq(quotes.id, input.id), 
              eq(quotes.userId, ctx.session.user.id)
            )
          )
          .limit(1);
          
        if (!existingQuote[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }
        
        // Update the quote status
        const [updatedQuote] = await ctx.db
          .update(quotes)
          .set({
            status: input.status,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(quotes.id, input.id), 
              eq(quotes.userId, ctx.session.user.id)
            )
          )
          .returning();
          
        if (!updatedQuote) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update quote status',
          });
        }
        
        return updatedQuote;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update quote status',
          cause: error,
        });
      }
    }),
});
