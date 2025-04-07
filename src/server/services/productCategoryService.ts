import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq, desc, asc } from 'drizzle-orm';
import { BaseService } from './baseService';
import { productCategories, users } from '../db/schema';
import type { DB } from './types';

// Define Zod schemas for input validation (adjust as needed)
const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

const deleteCategorySchema = z.object({
  id: z.string().uuid(),
});

const getCategoryByIdSchema = z.object({
  id: z.string().uuid(),
});

export class ProductCategoryService extends BaseService {
  /**
   * Get all product categories
   */
  async getAll({
    orderBy = 'name',
    sortOrder = 'asc',
  }: { orderBy?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    const orderColumn =
      productCategories[orderBy as keyof typeof productCategories.$inferSelect] ??
      productCategories.name;
    const direction = sortOrder === 'desc' ? desc : asc;

    const categories = await this.db.query.productCategories.findMany({
      orderBy: [direction(orderColumn)],
    });
    // TODO: Add pagination if necessary
    return categories.map((cat) => ({
      ...cat,
    }));
  }

  /**
   * Get a single product category by ID
   */
  async getById({ id }: z.infer<typeof getCategoryByIdSchema>) {
    const category = await this.db.query.productCategories.findFirst({
      where: eq(productCategories.id, id),
    });

    if (!category) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product category not found' });
    }
    return {
      ...category,
    };
  }

  /**
   * Create a new product category
   */
  async create({ data }: { data: z.infer<typeof createCategorySchema> }) {
    // Validate input against schema
    const validatedData = createCategorySchema.parse(data);

    const [newCategory] = await this.db
      .insert(productCategories)
      .values({
        ...validatedData,
        creatorId: this.currentUser?.user.id,
      })
      .returning();

    if (!newCategory) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create product category',
      });
    }

    return newCategory;
  }

  /**
   * Update an existing product category
   */
  async update({ data }: { data: z.infer<typeof updateCategorySchema> }) {
    // Validate input against schema
    const { id, ...updateData } = updateCategorySchema.parse(data);

    // Check if category exists (and potentially ownership if rules change)
    const existing = await this.db.query.productCategories.findFirst({
      where: eq(productCategories.id, id),
      columns: { id: true /*, creatorId: true */ },
    });

    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product category not found' });
    }

    // Add authorization checks here if creator ownership becomes required for updates

    const [updatedCategory] = await this.db
      .update(productCategories)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(productCategories.id, id))
      .returning();

    if (!updatedCategory) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update product category',
      });
    }

    return updatedCategory;
  }

  /**
   * Delete a product category
   */
  async delete({ data }: { data: z.infer<typeof deleteCategorySchema> }) {
    // Validate input against schema
    const { id } = deleteCategorySchema.parse(data);

    // Check if category exists (and potentially ownership if rules change)
    const existing = await this.db.query.productCategories.findFirst({
      where: eq(productCategories.id, id),
      columns: { id: true /*, creatorId: true */ },
    });

    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product category not found' });
    }

    // TODO: Consider implications - what happens to products using this category?
    // Schema might use ON DELETE SET NULL or RESTRICT. Handle accordingly.
    // If SET NULL, products will have categoryId = null.
    // If RESTRICT, deletion will fail if products reference it.
    const [deletedCategory] = await this.db
      .delete(productCategories)
      .where(eq(productCategories.id, id))
      .returning({ id: productCategories.id }); // Return ID to confirm deletion

    if (!deletedCategory) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete product category',
      });
    }

    return { id }; // Indicate success
  }
}
