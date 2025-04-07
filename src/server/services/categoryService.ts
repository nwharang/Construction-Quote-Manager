import { and, asc, count, desc, eq, ilike, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { BaseService } from './baseService';
import type { DB } from './types';
import type { Session } from 'next-auth';
import { productCategories, products } from '~/server/db/schema';

export const categoryInputSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
});

export class CategoryService extends BaseService {
  constructor(db: DB, ctx: { session: Session | null }) {
    super(db, ctx);
  }

  /**
   * Ensure the user is authenticated
   */
  private ensureAuthenticated(): void {
    if (!this.currentUser) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to perform this action',
      });
    }
  }

  /**
   * Get the current user's ID
   */
  private getUserId(): string {
    this.ensureAuthenticated();
    // We can safely assert here because ensureAuthenticated() would have thrown if not logged in
    return this.currentUser!.user.id;
  }

  /**
   * Get all categories with pagination and search
   */
  async getAll({
    limit = 10,
    page = 1,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: {
    limit?: number;
    page?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    try {
      const offset = (page - 1) * limit;

      // Base condition
      const whereCondition = search
        ? ilike(productCategories.name, `%${search}%`)
        : undefined;

      // Count total items for pagination
      const totalItemsResult = await this.db
        .select({ count: count() })
        .from(productCategories)
        .where(whereCondition);

      const totalItems = Number(totalItemsResult[0]?.count || 0);
      const totalPages = Math.ceil(totalItems / limit);

      // Determine sort column and direction
      let orderBy;
      if (sortBy === 'name') {
        orderBy = sortOrder === 'asc' ? asc(productCategories.name) : desc(productCategories.name);
      } else {
        // Default to created date
        orderBy =
          sortOrder === 'asc'
            ? asc(productCategories.createdAt)
            : desc(productCategories.createdAt);
      }

      // Get categories with product count
      const categoryItems = await this.db
        .select({
          id: productCategories.id,
          name: productCategories.name,
          description: productCategories.description,
          createdAt: productCategories.createdAt,
          updatedAt: productCategories.updatedAt,
          productCount: sql<number>`count(${products.id})`,
        })
        .from(productCategories)
        .leftJoin(products, eq(productCategories.id, products.categoryId))
        .where(whereCondition)
        .groupBy(productCategories.id)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return {
        items: categoryItems,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch categories',
        cause: error,
      });
    }
  }

  /**
   * Get a single category by ID
   */
  async getById(id: string) {
    try {
      const result = await this.db
        .select({
          id: productCategories.id,
          name: productCategories.name,
          description: productCategories.description,
          createdAt: productCategories.createdAt,
          updatedAt: productCategories.updatedAt,
          productCount: sql<number>`count(${products.id})`,
        })
        .from(productCategories)
        .leftJoin(products, eq(productCategories.id, products.categoryId))
        .where(eq(productCategories.id, id))
        .groupBy(productCategories.id);

      const category = result[0];

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      return category;
    } catch (error) {
      console.error('Error getting category by ID:', error);
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch category',
        cause: error,
      });
    }
  }

  /**
   * Create a new category
   */
  async create(data: z.infer<typeof categoryInputSchema>) {
    try {
      this.ensureAuthenticated();

      const userId = this.getUserId();

      const [newCategory] = await this.db
        .insert(productCategories)
        .values({
          name: data.name,
          description: data.description,
          creatorId: userId,
        })
        .returning();

      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create category',
        cause: error,
      });
    }
  }

  /**
   * Update an existing category
   */
  async update(id: string, data: z.infer<typeof categoryInputSchema>) {
    try {
      this.ensureAuthenticated();

      // Check if category exists
      const category = await this.db
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, id))
        .then((result) => result[0]);

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      const [updatedCategory] = await this.db
        .update(productCategories)
        .set({
          name: data.name,
          description: data.description,
          updatedAt: new Date(),
        })
        .where(eq(productCategories.id, id))
        .returning();

      return updatedCategory;
    } catch (error) {
      console.error('Error updating category:', error);
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update category',
        cause: error,
      });
    }
  }

  /**
   * Delete a category
   */
  async delete(id: string) {
    try {
      this.ensureAuthenticated();

      // Check if category exists
      const category = await this.db
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, id))
        .then((result) => result[0]);

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      // For products in this category, set categoryId to null
      await this.db
        .update(products)
        .set({ categoryId: null })
        .where(eq(products.categoryId, id));

      // Delete the category
      await this.db.delete(productCategories).where(eq(productCategories.id, id));

      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete category',
        cause: error,
      });
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: string, {
    limit = 10,
    page = 1,
  }: {
    limit?: number;
    page?: number;
  } = {}) {
    try {
      const offset = (page - 1) * limit;

      // Check if category exists
      const category = await this.db
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, categoryId))
        .then((result) => result[0]);

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      // Count total items for pagination
      const totalItemsResult = await this.db
        .select({ count: count() })
        .from(products)
        .where(eq(products.categoryId, categoryId));

      const totalItems = Number(totalItemsResult[0]?.count || 0);
      const totalPages = Math.ceil(totalItems / limit);

      // Get products
      const productItems = await this.db
        .select()
        .from(products)
        .where(eq(products.categoryId, categoryId))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        items: productItems,
        category,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error('Error getting products by category:', error);
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch products by category',
        cause: error,
      });
    }
  }
} 