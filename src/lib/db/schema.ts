import { pgTable, serial, text, varchar, timestamp, integer, decimal, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const quoteStatusEnum = pgEnum('quote_status', ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED']);

export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quotes = pgTable('quotes', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  projectName: varchar('project_name', { length: 255 }).notNull(),
  status: quoteStatusEnum('status').default('DRAFT').notNull(),
  subtotalTasks: decimal('subtotal_tasks', { precision: 10, scale: 2 }).default('0').notNull(),
  subtotalMaterials: decimal('subtotal_materials', { precision: 10, scale: 2 }).default('0').notNull(),
  complexityCharge: decimal('complexity_charge', { precision: 10, scale: 2 }).default('0').notNull(),
  markupCharge: decimal('markup_charge', { precision: 10, scale: 2 }).default('0').notNull(),
  grandTotal: decimal('grand_total', { precision: 10, scale: 2 }).default('0').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quoteTasks = pgTable('quote_tasks', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  quoteId: varchar('quote_id', { length: 128 }).notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  taskPrice: decimal('task_price', { precision: 10, scale: 2 }).default('0').notNull(),
  estimatedMaterialsCostLumpSum: decimal('estimated_materials_cost_lump_sum', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quoteMaterials = pgTable('quote_materials', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  quoteTaskId: varchar('quote_task_id', { length: 128 }).notNull().references(() => quoteTasks.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 128 }).references(() => products.id),
  description: varchar('description', { length: 255 }),
  quantity: integer('quantity').default(1).notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quotes: many(quotes),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  quoteMaterials: many(quoteMaterials),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  user: one(users, {
    fields: [quotes.userId],
    references: [users.id],
  }),
  tasks: many(quoteTasks),
}));

export const quoteTasksRelations = relations(quoteTasks, ({ one, many }) => ({
  quote: one(quotes, {
    fields: [quoteTasks.quoteId],
    references: [quotes.id],
  }),
  materials: many(quoteMaterials),
}));

export const quoteMaterialsRelations = relations(quoteMaterials, ({ one }) => ({
  task: one(quoteTasks, {
    fields: [quoteMaterials.quoteTaskId],
    references: [quoteTasks.id],
  }),
  product: one(products, {
    fields: [quoteMaterials.productId],
    references: [products.id],
  }),
})); 