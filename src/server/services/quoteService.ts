import { TRPCError } from '@trpc/server';
import { and, eq, sql, desc, asc, like, inArray } from 'drizzle-orm';
import { quotes, tasks, materials, customers, type QuoteStatusType } from '../db/schema';
import { type PgTransaction } from 'drizzle-orm/pg-core';
import { type PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { type DB, toNumber } from './index';
import { BaseService } from './baseService';

// Define Transaction type helper
type TransactionType = PgTransaction<PostgresJsQueryResultHKT, typeof import('../db/schema'), Record<string, never>>;

/**
 * Service layer for handling quote-related business logic
 */
export class QuoteService extends BaseService {
  constructor(private db: DB) {
    super();
  }

  /**
   * Get all quotes with filtering and pagination
   */
  async getAllQuotes({
    search,
    customerId,
    status,
    page,
    limit,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  }: {
    search?: string;
    customerId?: string;
    status?: QuoteStatusType;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const offset = (page - 1) * limit;

    // Build the where clause with filters
    const conditions: any[] = [];

    if (search) {
      conditions.push(like(quotes.title, `%${search}%`));
    }

    if (customerId) {
      conditions.push(eq(quotes.customerId, customerId));
    }

    if (status) {
      conditions.push(eq(quotes.status, status));
    }

    // Get total count of matching quotes
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count ?? 0);

    // Determine sort column and order
    let orderBy: any;
    const sortColumn = sortBy === 'customerName' ? customers.name : (quotes as any)[sortBy] || quotes.updatedAt;
    orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get quotes with pagination and customer details
    const quotesWithCustomers = await this.db
      .select({
        quote: quotes,
        customer: customers,
      })
      .from(quotes)
      .leftJoin(customers, eq(quotes.customerId, customers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Process quotes to convert string numeric values to numbers
    const processedQuotes = quotesWithCustomers.map(
      ({ quote, customer }: { quote: any; customer: any }) => ({
        ...quote,
        customer: customer || null,
        subtotalTasks: toNumber(quote.subtotalTasks),
        subtotalMaterials: toNumber(quote.subtotalMaterials),
        complexityCharge: toNumber(quote.complexityCharge),
        markupCharge: toNumber(quote.markupCharge),
        markupPercentage: toNumber(quote.markupPercentage),
        grandTotal: toNumber(quote.grandTotal),
      })
    );

    // Return paginated results with metadata
    return {
      items: processedQuotes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a quote by ID
   */
  async getQuoteById({
    id,
    includeRelated = false,
  }: {
    id: string;
    includeRelated?: boolean;
  }) {
    // Get the quote with customer
    const quotesWithCustomers = await this.db
      .select({
        quote: quotes,
        customer: customers,
      })
      .from(quotes)
      .leftJoin(customers, eq(quotes.customerId, customers.id))
      .where(eq(quotes.id, id))
      .limit(1);

    if (quotesWithCustomers.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Quote not found',
      });
    }

    const { quote, customer } = quotesWithCustomers[0];

    // Process quote to convert string numeric values to numbers using toNumber for consistency
    const processedQuote: any = {
      ...quote,
      customer: customer || null,
      subtotalTasks: toNumber(quote.subtotalTasks),
      subtotalMaterials: toNumber(quote.subtotalMaterials),
      complexityCharge: toNumber(quote.complexityCharge),
      markupCharge: toNumber(quote.markupCharge),
      markupPercentage: toNumber(quote.markupPercentage),
      grandTotal: toNumber(quote.grandTotal),
    };

    // Optionally include related tasks and materials
    if (includeRelated) {
      // Get tasks
      const tasksResult = await this.db
        .select()
        .from(tasks)
        .where(eq(tasks.quoteId, id))
        .orderBy(asc(tasks.order));

      // Process tasks using toNumber for consistency
      const processedTasks = tasksResult.map((task: any) => ({
        ...task,
        price: toNumber(task.price),
        quantity: task.quantity ? toNumber(task.quantity) : null,
        estimatedMaterialsCost: task.estimatedMaterialsCost ? toNumber(task.estimatedMaterialsCost) : null,
      }));

      // Get materials for each task
      for (const task of processedTasks) {
        const materialsResult = await this.db
          .select()
          .from(materials)
          .where(eq(materials.taskId, task.id));

        // Process materials using toNumber for consistency
        task.materials = materialsResult.map((material: any) => ({
          ...material,
          unitPrice: toNumber(material.unitPrice),
          quantity: toNumber(material.quantity),
        }));
      }

      // Add tasks to quote
      processedQuote.tasks = processedTasks;
    }

    return processedQuote;
  }

  /**
   * Create a new quote
   */
  async createQuote({
    data,
    userId,
  }: {
    data: {
      customerId: string;
      title: string;
      status?: QuoteStatusType;
      markupPercentage?: number;
      notes?: string;
      tasks?: {
        description: string;
        price: number;
        materialType: 'lumpsum' | 'itemized';
        materials?: {
          unitPrice: number;
          productId: string;
          quantity: number;
          notes?: string;
        }[];
        estimatedMaterialsCost?: number;
      }[];
    };
    userId: string;
  }) {
    // Verify customer exists
    const customer = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, data.customerId))
      .limit(1);

    if (customer.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Customer not found',
      });
    }

    // Set default values
    const quoteData = {
      userId,
      customerId: data.customerId,
      title: data.title,
      status: data.status || 'DRAFT',
      markupPercentage: data.markupPercentage?.toString() || '10',
      notes: data.notes || null,
      subtotalTasks: '0',
      subtotalMaterials: '0',
      complexityCharge: '0',
      markupCharge: '0',
      grandTotal: '0',
    };

    // Create quote and related tasks/materials in a transaction
    const result = await this.db.transaction(async (tx: any) => {
      const [quote] = await tx
        .insert(quotes)
        .values(quoteData)
        .returning();

      if (!quote) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create quote',
        });
      }

      // If tasks provided, insert them
      if (data.tasks && data.tasks.length > 0) {
        for (const taskData of data.tasks) {
          const [task] = await tx
            .insert(tasks)
            .values({
              quoteId: quote.id,
              description: taskData.description,
              price: taskData.price.toString(),
              materialType: taskData.materialType.toUpperCase() as 'LUMPSUM' | 'ITEMIZED' | undefined,
              estimatedMaterialsCost: taskData.estimatedMaterialsCost?.toString() ?? '0',
            })
            .returning();

          if (taskData.materialType === 'itemized' && taskData.materials && taskData.materials.length > 0 && task) {
            await tx.insert(materials).values(
              taskData.materials.map((materialData) => ({
                taskId: task.id,
                productId: materialData.productId,
                quantity: materialData.quantity,
                unitPrice: materialData.unitPrice.toString(),
                notes: materialData.notes || undefined,
              }))
            );
          }
        }

        // Recalculate quote totals
        await this.recalculateQuoteTotals({ quoteId: quote.id });
      }

      return quote;
    });

    // Return the created quote with numeric values
    return this.getQuoteById({ id: result.id, includeRelated: true });
  }

  /**
   * Recalculate all totals for a quote based on its tasks and materials
   */
  async recalculateQuoteTotals({
    quoteId,
    tx = this.db,
  }: {
    quoteId: string;
    tx?: DB | TransactionType; 
  }) {
    // Fetch the quote to get markup percentage
    const [quote] = await tx
      .select({
        markupPercentage: quotes.markupPercentage,
        // complexityPercentage removed as it doesn't exist in schema
      })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1);

    if (!quote) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Quote not found for recalculation' });
    }

    const markupPercent = toNumber(quote.markupPercentage) / 100;
    // Set complexityPercent to 0 as it's not stored directly
    const complexityPercent = 0; 

    // Calculate Subtotal Tasks - Remove quantity multiplication
    const taskTotals = await tx
      .select({ total: sql<number>`sum(${tasks.price})`.mapWith(Number) }) // Removed * tasks.quantity
      .from(tasks)
      .where(eq(tasks.quoteId, quoteId));
    const subtotalTasks = taskTotals[0]?.total ?? 0;

    // Calculate Subtotal Materials (no change here)
    const itemizedMaterialsTotalResult = await tx
      .select({ total: sql<number>`sum(${materials.unitPrice} * ${materials.quantity})`.mapWith(Number) })
      .from(materials)
      .innerJoin(tasks, and(eq(materials.taskId, tasks.id), eq(tasks.quoteId, quoteId)))
      .where(eq(tasks.materialType, 'ITEMIZED'));
    const itemizedMaterialsTotal = itemizedMaterialsTotalResult[0]?.total ?? 0;

    const lumpSumMaterialsTotalResult = await tx
      .select({ total: sql<number>`sum(${tasks.estimatedMaterialsCost})`.mapWith(Number) })
      .from(tasks)
      .where(and(eq(tasks.quoteId, quoteId), eq(tasks.materialType, 'LUMPSUM')));
    const lumpSumMaterialsTotal = lumpSumMaterialsTotalResult[0]?.total ?? 0;

    const subtotalMaterials = itemizedMaterialsTotal + lumpSumMaterialsTotal;
    // ... (rest of calculations: subtotalCombined, complexityCharge, markupCharge, grandTotal)
    const subtotalCombined = subtotalTasks + subtotalMaterials;
    const complexityCharge = subtotalCombined * complexityPercent; // Uses complexityPercent = 0
    const markupCharge = subtotalCombined * markupPercent;
    const grandTotal = subtotalCombined + complexityCharge + markupCharge;

    // Update the quote with calculated totals (no change here)
    await tx
      .update(quotes)
      .set({
        subtotalTasks: subtotalTasks.toFixed(2),
        subtotalMaterials: subtotalMaterials.toFixed(2),
        complexityCharge: complexityCharge.toFixed(2),
        markupCharge: markupCharge.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId));

    return this.getQuoteById({ id: quoteId, includeRelated: true });
  }

  /**
   * Update an existing quote
   */
  async updateQuote({
    id,
    data,
    userId,
  }: {
    id: string;
    data: {
      customerId?: string;
      title?: string;
      status?: QuoteStatusType;
      markupPercentage?: number;
      notes?: string;
      tasks?: {
        id?: string;
        description?: string;
        price?: number;
        materialType?: 'lumpsum' | 'itemized';
        estimatedMaterialsCostLumpSum?: number | null;
        materials?: {
          id?: string;
          name?: string;
          description?: string | null;
          quantity?: number;
          unitPrice?: number;
          productId?: string | null;
          notes?: string | null;
        }[];
      }[];
    };
    userId: string;
  }) {
    return this.db.transaction(async (tx: TransactionType) => {
      // 1. Fetch existing quote ... (no change here)
      const [existingQuote] = await tx
        .select()
        .from(quotes)
        .where(eq(quotes.id, id))
        .limit(1);

      if (!existingQuote) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quote not found or access denied' });
      }

      // 2. Update basic quote fields ... (no change here)
      const quoteUpdateData: Partial<typeof quotes.$inferInsert> = {};
      if (data.title !== undefined) quoteUpdateData.title = data.title;
      if (data.customerId !== undefined) quoteUpdateData.customerId = data.customerId;
      if (data.notes !== undefined) quoteUpdateData.notes = data.notes;
      if (data.status !== undefined) quoteUpdateData.status = data.status;
      if (data.markupPercentage !== undefined) quoteUpdateData.markupPercentage = data.markupPercentage.toString();
      quoteUpdateData.updatedAt = new Date();

      if (Object.keys(quoteUpdateData).length > 1) { 
        await tx.update(quotes).set(quoteUpdateData).where(eq(quotes.id, id));
      }

      // 3. Handle Task Updates/Creations/Deletions
      if (data.tasks) {
        const taskIds = data.tasks.map(task => task.id).filter(Boolean) as string[];
        const existingTaskIds = (await tx.select({ id: tasks.id }).from(tasks).where(eq(tasks.quoteId, id))).map(t => t.id);

        // Delete tasks not present in the input
        const tasksToDelete = existingTaskIds.filter(tid => !taskIds.includes(tid));
        if (tasksToDelete.length > 0) {
          // First delete associated materials
          await tx.delete(materials).where(inArray(materials.taskId, tasksToDelete));
          // Then delete the tasks
          await tx.delete(tasks).where(inArray(tasks.id, tasksToDelete));
        }

        // Update or Insert tasks
        for (const [index, taskData] of data.tasks.entries()) {
          const taskPayload = {
            quoteId: id,
            description: taskData.description ?? '', // Ensure default
            price: taskData.price?.toString() ?? '0', // Ensure default
            estimatedMaterialsCost: taskData.estimatedMaterialsCostLumpSum?.toString() ?? '0', // Ensure default
            materialType: taskData.materialType?.toUpperCase() as 'LUMPSUM' | 'ITEMIZED' | undefined, // Convert to UPPERCASE
            order: index,
            updatedAt: new Date(),
          };

          if (taskData.id && existingTaskIds.includes(taskData.id)) {
            // Update existing task
            await tx.update(tasks).set(taskPayload).where(eq(tasks.id, taskData.id));
          } else {
            // Insert new task
            const [newTask] = await tx.insert(tasks).values({
                ...taskPayload,
                createdAt: new Date(), 
                id: undefined 
            }).returning({ id: tasks.id });
            if (!newTask?.id) {
                console.error("Failed to insert task or retrieve ID for task:", taskData.description);
                continue; // Prevent material processing
            }
          }

          // Handle Materials for the current task
          if (taskData.materialType === 'itemized' && taskData.id) {
              const materialIds = taskData.materials?.map(mat => mat.id).filter(Boolean) as string[] || [];
              const existingMaterialIds = (await tx.select({ id: materials.id }).from(materials).where(eq(materials.taskId, taskData.id))).map(m => m.id);

              // Delete materials not present in the input
              const materialsToDelete = existingMaterialIds.filter(mid => !materialIds.includes(mid));
              if (materialsToDelete.length > 0) {
                  await tx.delete(materials).where(inArray(materials.id, materialsToDelete));
              }

              // Update or Insert materials
              if (taskData.materials) {
                  for (const materialData of taskData.materials) {
                      if (!materialData.productId) {
                        console.warn(`Skipping material '${materialData.name}' due to missing productId for task ${taskData.id}`);
                        continue; 
                      }

                      // Prepare payload - REMOVE name entirely
                      const materialPayload = {
                        taskId: taskData.id,
                        productId: materialData.productId,
                        quantity: materialData.quantity ?? 1,
                        unitPrice: materialData.unitPrice?.toString() ?? '0',
                        notes: materialData.notes || undefined,
                        updatedAt: new Date(),
                      };

                      // Use this payload directly for insert/update
                      const validMaterialPayload = materialPayload;

                      if (materialData.id && existingMaterialIds.includes(materialData.id)) {
                        // Update existing material - payload has no name
                        await tx.update(materials).set(validMaterialPayload)
                          .where(eq(materials.id, materialData.id));
                      } else {
                        // Insert new material - payload has no name
                        await tx.insert(materials).values({
                          ...validMaterialPayload,
                          createdAt: new Date(),
                          id: undefined,
                        });
                      }
                  }
              }
          }
        }
      }

      // 4. Recalculate Totals using the transaction connection
      await this.recalculateQuoteTotals({ quoteId: id, tx });

      // 5. Fetch and return the updated quote ... (no change here)
      const updatedQuote = await this.getQuoteById({ id: id, includeRelated: true });

      if (!updatedQuote) {
         throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve updated quote after update.' });
      }

      return updatedQuote;
    });
  }

  /**
   * Delete a quote
   */
  async deleteQuote({
    id,
    userId,
  }: {
    id: string;
    userId: string;
  }) {
    // Verify quote exists
    await this.getQuoteById({ id });

    // Delete the quote (cascade will delete tasks and materials)
    const result = await this.db
      .delete(quotes)
      .where(eq(quotes.id, id))
      .returning({ deletedId: quotes.id });

    if (result.length === 0) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete quote',
      });
    }

    return { success: true, deletedId: result[0].deletedId };
  }

  /**
   * Add a task to a quote
   */
  async addTask({
    quoteId,
    taskData,
  }: {
    quoteId: string;
    taskData: {
      description: string;
      price: number;
      materialType: 'lumpsum' | 'itemized';
      estimatedMaterialsCost?: number;
      materials?: {
        unitPrice: number;
        productId: string;
        quantity: number;
        notes?: string;
      }[];
    };
  }) {
    // Verify quote exists
    await this.getQuoteById({ id: quoteId });

    // Get current max order
    const maxOrderResult = await this.db
      .select({ maxOrder: sql<number>`max(${tasks.order})` })
      .from(tasks)
      .where(eq(tasks.quoteId, quoteId));
    const maxOrder = Number(maxOrderResult[0]?.maxOrder ?? -1);

    // Create task and materials in a transaction
    const result = await this.db.transaction(async (tx: any) => {
      const [task] = await tx
        .insert(tasks)
        .values({
          quoteId: quoteId,
          description: taskData.description,
          price: taskData.price.toString(),
          materialType: taskData.materialType.toUpperCase() as 'LUMPSUM' | 'ITEMIZED' | undefined,
          estimatedMaterialsCost: taskData.estimatedMaterialsCost?.toString() ?? '0',
          order: maxOrder + 1,
        })
        .returning();

      if (!task) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create task',
        });
      }

      if (taskData.materialType === 'itemized' && taskData.materials && taskData.materials.length > 0) {
        await tx
          .insert(materials)
          .values(
            taskData.materials.map((matInput) => ({
              taskId: task.id,
              productId: matInput.productId,
              quantity: matInput.quantity,
              unitPrice: matInput.unitPrice.toString(),
              notes: matInput.notes || undefined,
            }))
          );
      }
      return task;
    });

    // Recalculate quote totals
    await this.recalculateQuoteTotals({ quoteId });

    // Return created task with numeric values
    return {
      ...result,
      price: toNumber(result.price),
      estimatedMaterialsCost: result.estimatedMaterialsCost ? toNumber(result.estimatedMaterialsCost) : null,
    };
  }

  /**
   * Update a task in a quote
   */
  async updateTask({
    taskId,
    taskData,
  }: {
    taskId: string;
    taskData: {
      description?: string;
      price?: number;
      materialType?: 'lumpsum' | 'itemized';
      estimatedMaterialsCost?: number;
    };
  }) {
    // Get task
    const task = await this.db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

    if (task.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Task not found',
      });
    }

    // Verify quote exists
    await this.getQuoteById({ id: task[0].quoteId });

    // Prepare data to update
    const updateData: Record<string, any> = {};

    if (taskData.description) updateData.description = taskData.description;
    if (taskData.price !== undefined) updateData.price = taskData.price.toString();
    if (taskData.materialType) updateData.materialType = taskData.materialType.toUpperCase() as 'LUMPSUM' | 'ITEMIZED' | undefined;
    if (taskData.estimatedMaterialsCost !== undefined) {
      updateData.estimatedMaterialsCost = taskData.estimatedMaterialsCost?.toString() ?? '0';
    }

    // Update task
    const [updatedTask] = await this.db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();

    if (!updatedTask) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update task',
      });
    }

    // Recalculate quote totals
    await this.recalculateQuoteTotals({ quoteId: task[0].quoteId });

    // Return the updated task with numeric values
    return {
      ...updatedTask,
      price:
        typeof updatedTask.price === 'string' ? parseFloat(updatedTask.price) : updatedTask.price,
      estimatedMaterialsCost: updatedTask.estimatedMaterialsCost
        ? typeof updatedTask.estimatedMaterialsCost === 'string'
          ? parseFloat(updatedTask.estimatedMaterialsCost)
          : updatedTask.estimatedMaterialsCost
        : null,
    };
  }

  /**
   * Delete a task from a quote
   */
  async deleteTask({
    taskId,
  }: {
    taskId: string;
  }) {
    // Get task
    const task = await this.db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

    if (task.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Task not found',
      });
    }

    // Verify quote exists
    await this.getQuoteById({ id: task[0].quoteId });

    // Delete the task (cascade will delete materials)
    const result = await this.db.delete(tasks).where(eq(tasks.id, taskId)).returning({ deletedId: tasks.id });

    // Recalculate quote totals
    await this.recalculateQuoteTotals({ quoteId: task[0].quoteId });

    if (result.length === 0) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete task',
      });
    }

    return { success: true, deletedId: result[0].deletedId };
  }

  /**
   * Add a material to a task
   */
  async addMaterial({
    taskId,
    materialData,
  }: {
    taskId: string;
    materialData: {
      productId: string;
      quantity: number;
      unitPrice: number;
      notes?: string;
    };
  }) {
    // Get task
    const task = await this.db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

    if (task.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Task not found',
      });
    }

    // Verify task's materialType is 'itemized'
    if (task[0].materialType !== 'itemized') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot add materials to a lumpsum task',
      });
    }

    // Verify quote exists
    await this.getQuoteById({ id: task[0].quoteId });

    // Insert material
    const [createdMaterial] = await this.db
      .insert(materials)
      .values({
        taskId,
        productId: materialData.productId,
        quantity: materialData.quantity,
        unitPrice: materialData.unitPrice.toString(),
        notes: materialData.notes || null,
      })
      .returning();

    if (!createdMaterial) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add material to task',
      });
    }

    // Recalculate quote totals
    await this.recalculateQuoteTotals({ quoteId: task[0].quoteId });

    // Return the material with numeric values
    return {
      ...createdMaterial,
      unitPrice:
        typeof createdMaterial.unitPrice === 'string'
          ? parseFloat(createdMaterial.unitPrice)
          : createdMaterial.unitPrice,
      quantity:
        typeof createdMaterial.quantity === 'string' ? parseFloat(createdMaterial.quantity) : createdMaterial.quantity,
    };
  }

  /**
   * Update the status of a quote
   */
  async updateStatus({
    id,
    status,
    userId,
  }: {
    id: string;
    status: QuoteStatusType;
    userId: string;
  }) {
    // Verify quote exists
    await this.getQuoteById({ id });

    // Update the quote status
    const [updatedQuote] = await this.db
      .update(quotes)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, id))
      .returning();

    if (!updatedQuote) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update quote status',
      });
    }

    // Return the updated quote with numeric values
    return this.getQuoteById({ id, includeRelated: true });
  }

  /**
   * Update the charges of a quote
   */
  async updateCharges({
    id,
    complexityCharge,
    markupCharge,
    userId,
  }: {
    id: string;
    complexityCharge: number;
    markupCharge: number;
    userId: string;
  }) {
    // Get the quote with tasks to calculate subtotals
    const quote = await this.getQuoteById({ id, includeRelated: true });

    if (!quote) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Quote not found',
      });
    }

    // Ensure we have subtotals using toNumber for consistent handling
    const subtotalTasks = toNumber(quote.subtotalTasks);
    const subtotalMaterials = toNumber(quote.subtotalMaterials);
    const subtotal = subtotalTasks + subtotalMaterials;

    // Calculate grand total - use Math.round to ensure 2 decimal places
    const formattedComplexityCharge = Math.round(complexityCharge * 100) / 100;
    const formattedMarkupCharge = Math.round(markupCharge * 100) / 100;
    const grandTotal =
      Math.round((subtotal + formattedComplexityCharge + formattedMarkupCharge) * 100) / 100;

    // Update the quote
    const [updatedQuote] = await this.db
      .update(quotes)
      .set({
        complexityCharge: formattedComplexityCharge.toString(),
        markupCharge: formattedMarkupCharge.toString(),
        grandTotal: grandTotal.toString(),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, id));

    if (!updatedQuote) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update quote charges',
      });
    }

    // Return the updated quote with numeric values
    return this.getQuoteById({ id, includeRelated: true });
  }
}
