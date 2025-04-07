import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq, desc, asc, sql, ilike, or } from 'drizzle-orm';
import { BaseService } from './baseService';
import { products, productCategories, users } from '../db/schema';
import type { DB } from './types';

// Define Zod schemas for input validation (adjust as needed)
// Note: unitPrice is number in Zod, but string/Decimal in DB
const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().nullable(),
  unitPrice: z.number().min(0).optional().default(0),
  unit: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  unitPrice: z.number().min(0).optional(),
  unit: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const deleteProductSchema = z.object({
  id: z.string().uuid(),
});

const getProductByIdSchema = z.object({
  id: z.string().uuid(),
});

export class ProductService extends BaseService {
  /**
   * Get all products with optional filtering and sorting
   */
  async getAll({
    orderBy = 'name',
    sortOrder = 'asc',
    filter = '',
    page = 1,
    pageSize = 10,
  }: {
    orderBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const offset = (page - 1) * pageSize;
    const whereClause = filter ? ilike(products.name, `%${filter}%`) : undefined;

    const orderColumn = products[orderBy as keyof typeof products.$inferSelect] ?? products.name;
    const direction = sortOrder === 'desc' ? desc : asc;

    const paginatedProducts = await this.db.query.products.findMany({
      where: whereClause,
      orderBy: [direction(orderColumn)],
      limit: pageSize,
      offset: offset,
      with: {
        category: true,
      },
    });

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);
    const totalCount = totalCountResult[0]?.count ?? 0;

    const processedProducts = paginatedProducts.map((p) => ({
      ...p,
      unitPrice: this.toNumber(p.unitPrice),
      category: p.category,
    }));

    return {
      data: processedProducts,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  /**
   * Get a single product by ID
   */
  async getById({ id }: z.infer<typeof getProductByIdSchema>) {
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
      },
    });

    if (!product) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
    }
    return {
      ...product,
      unitPrice: this.toNumber(product.unitPrice),
      category: product.category,
    };
  }

  /**
   * Create a new product
   */
  async create({ data }: { data: z.infer<typeof createProductSchema> }) {
    // Validate input against schema
    const validatedData = createProductSchema.parse(data);

    const category = validatedData.categoryId
      ? await this.db.query.productCategories.findFirst({
          where: eq(productCategories.id, validatedData.categoryId),
          columns: { name: true },
        })
      : null;

    const [newProduct] = await this.db
      .insert(products)
      .values({
        ...validatedData,
        unitPrice: validatedData.unitPrice.toString(), // Convert number to string for DB
        creatorId: this.currentUser?.user.id,
      })
      .returning();

    if (!newProduct) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create product' });
    }

    // Return with price converted back to number for consistency
    return {
      ...newProduct,
      unitPrice: this.toNumber(newProduct.unitPrice),
      // Return the category with the product
      category,
    };
  }

  /**
   * Update an existing product
   */
  async update({ data }: { data: z.infer<typeof updateProductSchema> }) {
    // Validate input against schema
    const { id, ...updateData } = updateProductSchema.parse(data);

    // Check if product exists
    const existingProductWithRelations = await this.db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
      },
    });

    if (!existingProductWithRelations) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found for update' });
    }

    // Prepare update payload...
    // Destructure unitPrice from updateData to exclude it from the spread
    const { unitPrice, ...restUpdateData } = updateData;
    const updatePayload: Partial<typeof products.$inferInsert> = {
      ...restUpdateData, // Spread the rest of the fields
      updatedAt: new Date(),
    };
    // Handle unitPrice separately, converting to string for DB
    if (unitPrice !== undefined) {
      updatePayload.unitPrice = unitPrice.toString();
    }

    let updatedCategoryData = existingProductWithRelations.category; // Keep existing by default

    // If categoryId is being updated, fetch the new category name and full object
    if (updateData.categoryId !== undefined) {
      const newCategory = updateData.categoryId
        ? await this.db.query.productCategories.findFirst({
            where: eq(productCategories.id, updateData.categoryId),
          })
        : null;
      // Ensure updatedCategoryData is explicitly null if newCategory is null
      updatedCategoryData = newCategory ?? null;
    }

    const [updatedProductRaw] = await this.db
      .update(products)
      .set(updatePayload)
      .where(eq(products.id, id))
      .returning();

    if (!updatedProductRaw) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update product' });
    }

    return {
      ...updatedProductRaw,
      unitPrice: this.toNumber(updatedProductRaw.unitPrice),
      category: updatedCategoryData, // Return the correct full category object
    };
  }

  /**
   * Delete a product
   */
  async delete({ data }: { data: z.infer<typeof deleteProductSchema> }) {
    // Validate input against schema
    const { id } = deleteProductSchema.parse(data);

    const existing = await this.db.query.products.findFirst({
      where: eq(products.id, id),
      columns: { id: true },
    });

    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
    }

    // TODO: Check if product is used in materials? ON DELETE behavior?
    const [deletedProduct] = await this.db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (!deletedProduct) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete product' });
    }

    return { id }; // Indicate success
  }
  async getInfiniteProducts(data: {
    limit: number;
    search?: string | undefined;
    categoryId?: string | undefined;
    cursor?: string | null | undefined;
  }) {
    try {
      const { search, categoryId, limit, cursor } = data;
      const { gt } = await import('drizzle-orm');

      const orderBy = [asc(products.id)];

      const whereClause = and(
        cursor ? gt(products.id, cursor) : undefined,
        ...(search
          ? [
              or(
                ilike(products.name, `%${search}%`),
                ilike(products.description, `%${search}%`),
                ilike(products.sku, `%${search}%`)
              ),
            ]
          : []),
        ...(categoryId ? [eq(products.categoryId, categoryId)] : [])
      );

      const items = await this.db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit + 1);

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    } catch (error) {
      console.error('Error fetching infinite product list:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch product list for selection',
        cause: error,
      });
    }
  }
}
