import { TRPCError } from '@trpc/server';
import { and, eq, sql, desc, asc, like, inArray, SQL } from 'drizzle-orm';
import {
  quotes,
  tasks,
  materials,
  customers,
  type QuoteStatusType,
  products,
  type MaterialTypeType,
} from '../db/schema';
import { PgColumn } from 'drizzle-orm/pg-core';
import { type DB, type MaterialFields } from './index';
import { BaseService } from './baseService';
import type { Session } from 'next-auth';
import { type PgTransaction } from 'drizzle-orm/pg-core';

/**
 * Service layer for handling quote-related business logic
 */
export class QuoteService extends BaseService {
  constructor(db: DB, ctx: { session: Session | null }) {
    super(db, ctx);
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
    sortBy?: keyof typeof quotes;
    sortOrder?: 'asc' | 'desc';
  }) {
    const offset = (page - 1) * limit;

    // Build the where clause with filters
    const conditions: SQL[] = [];

    if (search) {
      conditions.push(like(quotes.title, `%${search}%`));
    }

    if (customerId) {
      conditions.push(eq(quotes.customerId, customerId));
    }

    if (status) {
      conditions.push(eq(quotes.status, status));
    }

    const result = await this.db.query.quotes.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        customer: true,
      },
      limit,
      orderBy:
        sortOrder === 'asc' ? asc(quotes[sortBy] as PgColumn) : desc(quotes[sortBy] as PgColumn),
      offset,
    });

    const total = Number(result.length ?? 0);

    // Process quotes to convert string numeric values to numbers
    const processedQuotes = result.map((quote) => ({
      ...quote,
      customer: quote.customer || null,
      subtotalTasks: this.toNumber(quote.subtotalTasks),
      subtotalMaterials: this.toNumber(quote.subtotalMaterials),
      complexityCharge: this.toNumber(quote.complexityCharge),
      markupCharge: this.toNumber(quote.markupCharge),
      markupPercentage: this.toNumber(quote.markupPercentage),
      grandTotal: this.toNumber(quote.grandTotal),
    }));

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
  async getQuoteById({ id }: { id: string; includeRelated?: boolean }) {
    // Get the quote with customer
    const quote = await this.db.query.quotes.findFirst({
      where: eq(quotes.id, id),
      with: {
        customer: true,
        tasks: {
          with: {
            materials: true,
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

    const customer = quote.customer;

    // Process quote to convert string numeric values to numbers using toNumber for consistency
    const processedQuote = {
      ...quote,
      customer: customer || null,
      subtotalTasks: this.toNumber(quote.subtotalTasks),
      subtotalMaterials: this.toNumber(quote.subtotalMaterials),
      complexityCharge: this.toNumber(quote.complexityCharge),
      markupCharge: this.toNumber(quote.markupCharge),
      markupPercentage: this.toNumber(quote.markupPercentage),
      grandTotal: this.toNumber(quote.grandTotal),
    };

    return processedQuote;
  }

  /**
   * Create a new quote
   */
  async createQuote({
    data,
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
          productName?: string;
          unitPrice: number;
          productId: string;
          quantity: number;
          notes?: string;
        }[];
        estimatedMaterialsCostLumpSum?: number;
      }[];
    };
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
    const quote = await this.db.transaction(async (tx) => {
      const [insertedQuote] = await tx.insert(quotes).values(quoteData).returning();

      if (!insertedQuote) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create quote',
        });
      }
      const allProductIdsFromMaterials: string[] = [];
      data.tasks?.forEach((x) => {
        if (x.materials) {
          x.materials.forEach((y) => {
            if (y.productId) {
              allProductIdsFromMaterials.push(y.productId);
            }
          });
        }
      });


      const productDataMap: Map<string, string> = new Map();
      if (allProductIdsFromMaterials.length > 0) {
        const uniqueProductIds = [...new Set(allProductIdsFromMaterials)];
        const fetchedProducts = await tx.query.products.findMany({
          where: inArray(products.id, uniqueProductIds),
          columns: { id: true, name: true },
        });
        fetchedProducts.forEach((p) => {
          // Ensure p.name is not null/undefined before setting. If it can be null, handle accordingly.
          if (p.name) {
            // Assuming product names are expected to be non-null strings
            productDataMap.set(p.id, p.name);
          }
        });
      }

      // If tasks provided, insert them
      if (data.tasks && data.tasks.length > 0) {
        for (const taskData of data.tasks) {
          const [insertedTask] = await tx
            .insert(tasks)
            .values({
              quoteId: insertedQuote.id,
              description: taskData.description,
              price: taskData.price.toString(),
              materialType: taskData.materialType.toUpperCase() as
                | 'LUMPSUM'
                | 'ITEMIZED'
                | undefined,
              estimatedMaterialsCostLumpSum:
                taskData.estimatedMaterialsCostLumpSum?.toString() ?? null,
            })
            .returning();

          if (
            taskData.materialType === 'itemized' &&
            taskData.materials &&
            taskData.materials.length > 0 &&
            insertedTask // Check if task was inserted successfully
          ) {
            await tx.insert(materials).values(
              taskData.materials.map((materialData) => ({
                taskId: insertedTask.id,
                productId: materialData.productId,
                productName: productDataMap.get(materialData.productId),
                quantity: materialData.quantity,
                unitPrice: materialData.unitPrice.toString(),
                notes: materialData.notes || undefined,
              }))
            );
          }
        }
      }

      return insertedQuote; // Return the basic inserted quote data
    });

    // After the transaction is successful, recalculate totals
    if (quote) {
      await this.recalculateQuoteTotals({ quoteId: quote.id });
    }

    // Return the created quote with potentially updated totals (fetched by getQuoteById)
    return this.getQuoteById({ id: quote.id, includeRelated: true });
  }

  /**
   * Recalculate all totals for a quote based on its tasks and materials
   */
  async recalculateQuoteTotals({ quoteId, tx }: { quoteId: string; tx?: DB /* | Tx */ }) {
    const dbOrTx = tx ?? this.db;

    // Fetch all tasks and their materials for the quote
    const quoteTasks = await dbOrTx.query.tasks.findMany({
      where: eq(tasks.quoteId, quoteId),
      with: {
        materials: {}, // Fetch materials to calculate their cost
      },
    });

    // --- Refactored Calculation Logic ---

    let calculatedSubtotalTasks = 0;
    let calculatedSubtotalMaterials = 0;

    quoteTasks.forEach((task) => {
      const taskPrice = this.toNumber(task.price);
      const taskMaterialCost = this.calculateTaskMaterialsTotalInternal(task);
      calculatedSubtotalTasks += taskPrice;
      calculatedSubtotalMaterials += taskMaterialCost;
    });

    const subtotalTasks = this.roundCurrency(calculatedSubtotalTasks);
    const subtotalMaterials = this.roundCurrency(calculatedSubtotalMaterials);
    const subtotalCombined = this.roundCurrency(subtotalTasks + subtotalMaterials);

    // Fetch quote details needed for final calculations
    const quote = await dbOrTx.query.quotes.findFirst({
      where: eq(quotes.id, quoteId),
      columns: {
        markupPercentage: true,
        complexityCharge: true,
        markupCharge: true, // Fetch existing fixed markup charge
      },
    });

    if (!quote) {
      console.error(`Recalculation failed: Quote ${quoteId} not found.`);
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Quote ${quoteId} not found during recalculation.`,
      });
    }

    const markupPercentageInput = this.toNumber(quote.markupPercentage);
    const complexityChargeValue = this.toNumber(quote.complexityCharge); // Fixed value

    // Calculate charges based on combined subtotal
    const calculatedComplexityCharge = this.roundCurrency(
      subtotalCombined * (complexityChargeValue / 100) // Assuming complexityCharge is a % stored as number needing conversion
    );

    const markupBase = this.roundCurrency(subtotalCombined + calculatedComplexityCharge);

    // ALWAYS recalculate markup based on percentage during recalculation
    const calculatedMarkupCharge = this.roundCurrency(markupBase * markupPercentageInput); // Use direct decimal

    // Calculate grand total
    const rawGrandTotal = subtotalCombined + calculatedComplexityCharge + calculatedMarkupCharge;
    const grandTotal = this.roundCurrency(rawGrandTotal); // Use roundCurrency helper

    // --- End Refactored Calculation Logic ---

    // Update the quote with calculated totals (ensure conversion to string for DB)
    await dbOrTx
      .update(quotes)
      .set({
        subtotalTasks: subtotalTasks.toString(),
        subtotalMaterials: subtotalMaterials.toString(),
        markupCharge: calculatedMarkupCharge.toString(), // Store the calculated markup amount
        grandTotal: grandTotal.toString(),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId));

    return { success: true };
  }

  /**
   * Helper to calculate the materials total for a single task.
   * Uses service's toNumber and roundCurrency methods.
   */
  private calculateTaskMaterialsTotalInternal(task: {
    materialType?: 'LUMPSUM' | 'ITEMIZED'; // Use uppercase enum values from schema
    estimatedMaterialsCostLumpSum?: string | null; // Expect string from DB
    materials: Array<{ quantity: number; unitPrice: string }>; // Expect string from DB
  }): number {
    if (task.materialType === 'LUMPSUM') {
      // Use the correct field name and convert from string
      return this.toNumber(task.estimatedMaterialsCostLumpSum);
    }

    if (task.materialType === 'ITEMIZED' && Array.isArray(task.materials)) {
      const total = task.materials.reduce((sum, material) => {
        const unitPrice = this.toNumber(material.unitPrice);
        const lineTotal = material.quantity * unitPrice;
        return sum + lineTotal;
      }, 0);
      // No need to round here, will be rounded when summing up all tasks' materials
      return total;
    }
    return 0;
  }

  /**
   * Update an existing quote
   */
  async updateQuote({
    id,
    data,
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
          productName?: string | null;
          description?: string | null;
          quantity?: number;
          unitPrice?: number;
          productId?: string | null;
          notes?: string | null;
        }[];
      }[];
    };
  }) {
    // Capture the result of the transaction
    const transactionResult = await this.db.transaction(async (tx) => {
      // 1. Fetch existing quote ... (no change here)
      const [existingQuote] = await tx.select().from(quotes).where(eq(quotes.id, id)).limit(1);

      if (!existingQuote) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quote not found or access denied' });
      }

      // 2. Update basic quote fields ... (no change here)
      const quoteUpdateData: Partial<typeof quotes.$inferInsert> = {};
      if (data.title !== undefined) quoteUpdateData.title = data.title;
      if (data.customerId !== undefined) quoteUpdateData.customerId = data.customerId;
      if (data.notes !== undefined) quoteUpdateData.notes = data.notes;
      if (data.status !== undefined) quoteUpdateData.status = data.status;
      if (data.markupPercentage !== undefined)
        quoteUpdateData.markupPercentage = data.markupPercentage.toString();
      quoteUpdateData.updatedAt = new Date();

      if (Object.keys(quoteUpdateData).length > 1) {
        await tx.update(quotes).set(quoteUpdateData).where(eq(quotes.id, id));
      }

      // 3. Handle Task Updates/Creations/Deletions
      if (data.tasks !== undefined) {
        // Check if tasks array is provided, even if empty
        const incomingTasks = data.tasks;
        const quoteId = id;

        // --- START: Product Name Fetching Logic ---
        const allProductIdsFromMaterials: string[] = [];
        for (const taskData of incomingTasks) {
          if (taskData.materialType === 'itemized' && taskData.materials) {
            for (const mat of taskData.materials) {
              if (mat.productId) {
                allProductIdsFromMaterials.push(mat.productId);
              }
            }
          }
        }

        const productDataMap: Map<string, string> = new Map();
        if (allProductIdsFromMaterials.length > 0) {
          const uniqueProductIds = [...new Set(allProductIdsFromMaterials)];
          const fetchedProducts = await tx.query.products.findMany({
            where: inArray(products.id, uniqueProductIds),
            columns: { id: true, name: true },
          });
          fetchedProducts.forEach((p) => {
            // Ensure p.name is not null/undefined before setting. If it can be null, handle accordingly.
            if (p.name) {
              // Assuming product names are expected to be non-null strings
              productDataMap.set(p.id, p.name);
            }
          });
        }
        // --- END: Product Name Fetching Logic ---

        const existingTaskIdsQuery = tx
          .select({ id: tasks.id })
          .from(tasks)
          .where(eq(tasks.quoteId, quoteId));

        const existingTaskIds = (await existingTaskIdsQuery).map((t) => t.id);

        if (existingTaskIds.length > 0) {
          // Delete associated materials first
          await tx.delete(materials).where(inArray(materials.taskId, existingTaskIds));
          // Then delete the tasks themselves
          await tx.delete(tasks).where(eq(tasks.quoteId, quoteId));
        }

        // 2. Prepare and Bulk Insert all incoming tasks
        const newTasksToInsert: (typeof tasks.$inferInsert)[] = [];
        const materialsToInsert: (typeof materials.$inferInsert)[] = [];
        const taskMaterialMap: Record<number, { taskId: string; materials: any[] }> = {};

        for (const [index, taskData] of incomingTasks.entries()) {
          // Generate a new UUID for each task *before* inserting
          // Drizzle doesn't auto-generate UUIDs on bulk insert if the column allows null/undefined
          // We need the ID immediately to link materials
          const newTaskId = crypto.randomUUID();

          newTasksToInsert.push({
            id: newTaskId, // Assign the generated ID
            quoteId: quoteId,
            description: taskData.description ?? '',
            price: taskData.price?.toString() ?? '0',
            estimatedMaterialsCostLumpSum:
              taskData.estimatedMaterialsCostLumpSum?.toString() ?? null,
            materialType:
              (taskData.materialType?.toUpperCase() as 'LUMPSUM' | 'ITEMIZED') ?? 'LUMPSUM',
            order: index,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Store materials temporarily, linked to the new task ID and original index
          if (taskData.materialType === 'itemized' && taskData.materials) {
            // --- START: Enrich materials with DB-fetched productName ---
            const enrichedMaterials = taskData.materials.map((mat) => {
              const newMat = { ...mat }; // Create a new object
              if (newMat.productId) {
                const dbProductName = productDataMap.get(newMat.productId);
                newMat.productName = dbProductName ?? ''; // Use DB name or empty string
              }
              // If no productId, newMat.name remains as is from input (or default if not provided)
              return newMat;
            });
            taskMaterialMap[index] = { taskId: newTaskId, materials: enrichedMaterials };
            // --- END: Enrich materials ---
          }
        }

        // Bulk insert tasks if any exist
        let insertedTaskIds: { id: string }[] = [];
        if (newTasksToInsert.length > 0) {
          insertedTaskIds = await tx
            .insert(tasks)
            .values(newTasksToInsert)
            .returning({ id: tasks.id });
          if (insertedTaskIds.length !== newTasksToInsert.length) {
            console.error('Mismatch between tasks to insert and returned IDs');
            // Consider throwing an error or more robust handling
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to insert all tasks correctly.',
            });
          }
        }

        // --- Material Handling Refactor ---
        // All old materials were deleted with their tasks. Now, bulk insert new ones.

        for (const [originalIndex, taskInfo] of Object.entries(taskMaterialMap)) {
          const { taskId, materials: taskMaterialsData } = taskInfo;
          for (const materialData of taskMaterialsData) {
            // Skip materials without a productId
            if (!materialData.productId) {
              console.warn(
                `Skipping material '${materialData.name}' due to missing productId for task ${taskId}`
              );
              continue;
            }

            // Prepare material payload for bulk insert
            materialsToInsert.push({
              // id: undefined, // Let DB generate or use default if needed
              taskId: taskId, // Link to the newly inserted task
              productId: materialData.productId,
              productName: materialData.productName,
              quantity: materialData.quantity ?? 1,
              unitPrice: materialData.unitPrice?.toString() ?? '0',
              notes: materialData.notes || undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        // Bulk insert materials if any exist
        if (materialsToInsert.length > 0) {
          await tx.insert(materials).values(materialsToInsert);
        }
      } // End of task handling block

      // --- Transaction Ends Here ---
      // The main insert/delete/update operations are committed at this point.

      // Return the quote ID so we can recalculate outside the main transaction
      return { updatedQuoteId: id };
    }); // End of db.transaction

    // --- Recalculation Outside Transaction ---
    // Use the quote ID returned from the transaction
    if (transactionResult?.updatedQuoteId) {
      try {
        // Use the main db instance (this.db), not the transaction (tx)
        await this.recalculateQuoteTotals({ quoteId: transactionResult.updatedQuoteId });
      } catch (recalcError) {
        // Log the recalculation error but don't necessarily fail the whole update
        // The quote was updated, just the totals might be stale.
        console.error(
          `Recalculation failed for quote ${transactionResult.updatedQuoteId} after update:`,
          recalcError
        );
        // Depending on requirements, you might want to throw a specific error or handle this differently.
      }
    }

    // 5. Fetch and return the updated quote ... (no change here)
    // Fetch using the original ID, after recalculation (if successful)
    const updatedQuote = await this.getQuoteById({ id: id, includeRelated: true });

    if (!updatedQuote) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve updated quote after update and recalculation.', // Updated message
      });
    }

    return updatedQuote;
  }

  /**
   * Delete a quote
   */
  async deleteQuote({ id }: { id: string }) {
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

    return { success: true, deletedId: result[0]?.deletedId };
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
      estimatedMaterialsCostLumpSum?: number;
      materials?: {
        unitPrice: number;
        productName?: string;
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
    const result = await this.db.transaction(async (tx) => {
      const [task] = await tx
        .insert(tasks)
        .values({
          quoteId: quoteId,
          description: taskData.description,
          price: taskData.price.toString(),
          materialType: taskData.materialType.toUpperCase() as 'LUMPSUM' | 'ITEMIZED' | undefined,
          estimatedMaterialsCostLumpSum: taskData.estimatedMaterialsCostLumpSum?.toString() ?? null,
          order: maxOrder + 1,
        })
        .returning();

      if (!task) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create task',
        });
      }

      if (
        taskData.materialType === 'itemized' &&
        taskData.materials &&
        taskData.materials.length > 0
      ) {
        await tx.insert(materials).values(
          taskData.materials.map((matInput) => ({
            taskId: task.id,
            productId: matInput.productId,
            productName: matInput.productName,
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
      price: this.toNumber(result.price),
      estimatedMaterialsCostLumpSum: result.estimatedMaterialsCostLumpSum
        ? this.toNumber(result.estimatedMaterialsCostLumpSum)
        : null,
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
      estimatedMaterialsCostLumpSum?: number;
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
    await this.getQuoteById({ id: task[0]!.quoteId });

    // Prepare data to update
    const updateData: Record<string, string | number | undefined | null> = {};

    if (taskData.description) updateData.description = taskData.description;
    if (taskData.price !== undefined) updateData.price = taskData.price.toString();
    if (taskData.materialType)
      updateData.materialType = taskData.materialType.toUpperCase() as
        | 'LUMPSUM'
        | 'ITEMIZED'
        | undefined;
    if (taskData.estimatedMaterialsCostLumpSum !== undefined) {
      updateData.estimatedMaterialsCostLumpSum =
        taskData.estimatedMaterialsCostLumpSum?.toString() ?? null;
    }

    // Wrap update and recalculation in a transaction
    const result = await this.db.transaction(async (tx) => {
      // Update task
      const [updatedTask] = await tx
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

      // Recalculate quote totals within the transaction
      await this.recalculateQuoteTotals({ quoteId: task[0]!.quoteId });

      return updatedTask;
    });

    // Return the updated task with numeric values
    return {
      ...result, // Use the result from the transaction
      price: typeof result.price === 'string' ? parseFloat(result.price) : result.price,
      estimatedMaterialsCostLumpSum: result.estimatedMaterialsCostLumpSum
        ? typeof result.estimatedMaterialsCostLumpSum === 'string'
          ? parseFloat(result.estimatedMaterialsCostLumpSum)
          : result.estimatedMaterialsCostLumpSum
        : null,
    };
  }

  /**
   * Delete a task from a quote
   */
  async deleteTask({ taskId }: { taskId: string }) {
    // Get task
    const task = await this.db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

    if (task.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Task not found',
      });
    }

    // Verify quote exists
    await this.getQuoteById({ id: task[0]!.quoteId });

    // Wrap delete and recalculation in a transaction
    const result = await this.db.transaction(async (tx) => {
      // Delete the task (cascade will delete materials)
      const deleteResult = await tx
        .delete(tasks)
        .where(eq(tasks.id, taskId))
        .returning({ deletedId: tasks.id });

      if (deleteResult.length === 0) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete task during transaction', // More specific error
        });
      }

      // Recalculate quote totals within the transaction
      await this.recalculateQuoteTotals({ quoteId: task[0]!.quoteId });

      return deleteResult[0]; // Return the object with deletedId
    });

    return { success: true, deletedId: result!.deletedId };
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

    // Verify quote exists
    await this.getQuoteById({ id: task[0]!.quoteId });

    // Wrap insert and recalculation in a transaction
    const result = await this.db.transaction(async (tx) => {
      // Insert material
      const [createdMaterial] = await tx
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
          message: 'Failed to create material',
        });
      }

      // Recalculate quote totals within the transaction
      await this.recalculateQuoteTotals({ quoteId: task[0]!.quoteId });

      return createdMaterial;
    });

    // Return the created material with numeric values
    return {
      ...result,
      unitPrice: this.toNumber(result.unitPrice),
    };
  }

  /**
   * Update the status of a quote
   */
  async updateStatus({ id, status }: { id: string; status: QuoteStatusType }) {
    return this.db.transaction(async (tx) => {
      // Verify quote exists using tx
      const quote = await tx.query.quotes.findFirst({
        where: eq(quotes.id, id),
        columns: { id: true },
      });
      if (!quote) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quote not found.' });
      }

      // Update the quote status using tx
      const [updatedQuote] = await tx
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
      // Return minimal info from transaction
      return { updatedId: updatedQuote.id, newStatus: updatedQuote.status };
    });
  }

  /**
   * Update the charges of a quote and recalculate totals
   */
  async updateCharges({
    id,
    complexityCharge,
    markupCharge,
  }: {
    id: string;
    complexityCharge: number;
    markupCharge: number;
  }) {
    return this.db.transaction(async (tx) => {
      // 1. Verify quote exists using tx
      const quote = await tx.query.quotes.findFirst({
        where: eq(quotes.id, id),
        columns: { id: true },
      });
      if (!quote) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quote not found.' });
      }

      // 2. Format and Update specific charges using tx
      const formattedComplexityCharge = this.roundCurrency(complexityCharge);
      const formattedMarkupCharge = this.roundCurrency(markupCharge);

      const [updateResult] = await tx
        .update(quotes)
        .set({
          complexityCharge: formattedComplexityCharge.toString(),
          markupCharge: formattedMarkupCharge.toString(),
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, id))
        .returning({ id: quotes.id });

      if (!updateResult) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update quote charges',
        });
      }

      // 3. Recalculate totals using tx
      await this.recalculateQuoteTotals({ quoteId: id, tx });

      // 4. Return success or minimal data
      return { updatedId: updateResult.id };
    });
  }
}
