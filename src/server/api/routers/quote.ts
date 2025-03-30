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

        // Build the where clause safely
        let whereClause = eq(quotes.userId, ctx.session.user.id);

        if (input.search) {
          const searchPattern = `%${input.search}%`;
          // For email that can be null, create a safe condition
          const titleCondition = ilike(quotes.title, searchPattern);
          const nameCondition = ilike(quotes.customerName, searchPattern);
          const emailCondition = sql`${quotes.customerEmail} ILIKE ${searchPattern}`;
          
          // Combine with OR for the search terms
          const searchCondition = sql`(${titleCondition} OR ${nameCondition} OR ${emailCondition})`;
          
          // Combine with AND for the user ID filter
          whereClause = sql`${whereClause} AND ${searchCondition}`;
        }
        
        if (input.status) {
          // Add status filter using the same pattern
          const statusCondition = eq(quotes.status, input.status);
          whereClause = sql`${whereClause} AND ${statusCondition}`;
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

        // Transform the data to use numeric types for front-end consumption
        return {
          quotes: quotesWithCustomers.map(({ quote, customer }) => ({
            ...quote,
            // Currency values are already numeric in the database now - no parsing needed
            subtotalTasks: Number(quote.subtotalTasks),
            subtotalMaterials: Number(quote.subtotalMaterials),
            complexityCharge: Number(quote.complexityCharge),
            markupCharge: Number(quote.markupCharge),
            markupPercentage: Number(quote.markupPercentage),
            grandTotal: Number(quote.grandTotal),
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
        title: z.string().min(1, "Title is required"),
        customerName: z.string().min(1, "Customer name is required"),
        customerEmail: z.string().email("Invalid email address").optional().nullable(),
        customerPhone: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        complexityCharge: z.number().min(0).default(0),
        markupPercentage: z.number().min(0).default(10)
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

        // Calculate initial values for the quote
        const markupCharge = 0; // Initially zero, will be calculated when tasks/materials are added
        const quoteId = crypto.randomUUID();
        
        // Create the quote with the customer ID
        const [quote] = await ctx.db
          .insert(quotes)
          .values({
            id: quoteId,
            title: input.title,
            customerId,
            customerName: input.customerName,
            customerEmail: input.customerEmail || null,
            customerPhone: input.customerPhone || null,
            status: QuoteStatus.DRAFT,
            subtotalTasks: '0',
            subtotalMaterials: '0',
            complexityCharge: input.complexityCharge.toString(),
            markupCharge: markupCharge.toString(),
            markupPercentage: input.markupPercentage.toString(),
            grandTotal: '0',
            notes: input.notes || null,
            userId: ctx.session.user.id,
          })
          .returning();

        if (!quote) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create quote',
          });
        }

        return quote;
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
        id: z.string().min(1, "Quote ID is required"),
        title: z.string().min(1, "Title is required"),
        customerName: z.string().min(1, "Customer name is required"),
        customerEmail: z.string().email("Invalid email address").optional().nullable(),
        customerPhone: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        status: z.enum([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED], {
          errorMap: () => ({ message: "Status must be one of: DRAFT, SENT, ACCEPTED, REJECTED" })
        }).optional(),
        subtotalTasks: z.number().min(0),
        subtotalMaterials: z.number().min(0),
        complexityCharge: z.number().min(0),
        markupCharge: z.number().min(0),
        grandTotal: z.number().min(0),
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

        // Apply rounding to all numeric values
        const subtotalTasks = Math.round(input.subtotalTasks * 100) / 100;
        const subtotalMaterials = Math.round(input.subtotalMaterials * 100) / 100;
        const complexityCharge = Math.round(input.complexityCharge * 100) / 100;
        const markupCharge = Math.round(input.markupCharge * 100) / 100;
        // Calculate grand total to ensure consistency
        const grandTotal = Math.round((subtotalTasks + subtotalMaterials + complexityCharge + markupCharge) * 100) / 100;

        // Update the quote with the customer ID and financial details
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
            // Store numeric values as strings in the database
            subtotalTasks: subtotalTasks.toString(),
            subtotalMaterials: subtotalMaterials.toString(),
            complexityCharge: complexityCharge.toString(),
            markupCharge: markupCharge.toString(),
            grandTotal: grandTotal.toString(),
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

        // Convert the string values to numbers for client consumption
        return {
          ...quote,
          subtotalTasks: Number(quote.subtotalTasks),
          subtotalMaterials: Number(quote.subtotalMaterials),
          complexityCharge: Number(quote.complexityCharge),
          markupCharge: Number(quote.markupCharge),
          markupPercentage: Number(quote.markupPercentage),
          grandTotal: Number(quote.grandTotal),
        };
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
    .input(z.object({ id: z.string().min(1, "Quote ID is required") }))
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
            message: 'Quote not found or you do not have permission to delete it',
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

        return { success: true, id: deletedQuote.id };
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
        id: z.string().min(1, "Quote ID is required"),
        complexityCharge: z.number().min(0, "Complexity charge must be non-negative"),
        markupCharge: z.number().min(0, "Markup charge must be non-negative")
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if the quote exists and belongs to the user
        const quoteData = await ctx.db
          .select()
          .from(quotes)
          .where(
            and(
              eq(quotes.id, input.id),
              eq(quotes.userId, ctx.session?.user.id || '')
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
        
        // Calculate grand total - use Math.round to ensure 2 decimal places
        const complexityCharge = Math.round(input.complexityCharge * 100) / 100;
        const markupCharge = Math.round(input.markupCharge * 100) / 100;
        const grandTotal = Math.round((subtotal + complexityCharge + markupCharge) * 100) / 100;
        
        // Update the quote
        const [updatedQuote] = await ctx.db
          .update(quotes)
          .set({
            complexityCharge: complexityCharge.toString(),
            subtotalTasks: subtotalTasks.toString(),
            subtotalMaterials: subtotalMaterials.toString(),
            markupCharge: markupCharge.toString(),
            grandTotal: grandTotal.toString(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(quotes.id, input.id), 
              eq(quotes.userId, ctx.session?.user.id || '')
            )
          )
          .returning();
          
        if (!updatedQuote) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update quote charges',
          });
        }
        
        // Convert the string values to numbers for client consumption
        return {
          ...updatedQuote,
          subtotalTasks: parseFloat(updatedQuote.subtotalTasks),
          subtotalMaterials: parseFloat(updatedQuote.subtotalMaterials),
          complexityCharge: parseFloat(updatedQuote.complexityCharge),
          markupCharge: parseFloat(updatedQuote.markupCharge),
          markupPercentage: parseFloat(updatedQuote.markupPercentage),
          grandTotal: parseFloat(updatedQuote.grandTotal),
        };
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
        id: z.string().min(1, "Quote ID is required"),
        status: z.enum([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED], {
          errorMap: () => ({ message: "Status must be one of: DRAFT, SENT, ACCEPTED, REJECTED" })
        }),
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
