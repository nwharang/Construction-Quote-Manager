import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  pgEnum,
  primaryKey,
  varchar,
  index,
} from 'drizzle-orm/pg-core';
import { type AdapterAccount } from 'next-auth/adapters';
/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

// Quote status enum
export const quoteStatusEnum = pgEnum('quote_status', ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']);

export const QuoteStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export type QuoteStatusType = (typeof QuoteStatus)[keyof typeof QuoteStatus];

// Users table (with authentication fields)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: text('username').unique(),
  hashedPassword: text('hashed_password'),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  emailVerified: timestamp('email_verified'),
});

// NextAuth Sessions table
export const sessions = pgTable(
  'session',
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: 'date', withTimezone: true }).notNull(),
  }),
  (t) => [index('t_user_id_idx').on(t.userId)]
);
// NextAuth Accounts table
export const accounts = pgTable(
  'account',
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount['type']>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index('account_user_id_idx').on(t.userId),
  ]
);

// NextAuth Verification Tokens table

export const verificationTokens = pgTable(
  'verification_token',
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: 'date', withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// Quotes table
export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  status: varchar('status', { length: 20 })
    .notNull()
    .$type<QuoteStatusType>()
    .default(QuoteStatus.DRAFT),
  subtotalTasks: varchar('subtotal_tasks', { length: 50 }).notNull().default('0'),
  subtotalMaterials: varchar('subtotal_materials', { length: 50 }).notNull().default('0'),
  complexityCharge: varchar('complexity_charge', { length: 50 }).notNull().default('0'),
  markupCharge: varchar('markup_charge', { length: 50 }).notNull().default('0'),
  grandTotal: varchar('grand_total', { length: 50 }).notNull().default('0'),
  notes: text('notes'),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteId: uuid('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  estimatedMaterialsCost: decimal('estimated_materials_cost', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Materials table
export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Quotes table
export const quotesRelations = relations(quotes, ({ many }) => ({
  tasks: many(tasks),
}));

// Tasks table
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  quote: one(quotes, {
    fields: [tasks.quoteId],
    references: [quotes.id],
  }),
  materials: many(materials),
}));

// Materials table
export const materialsRelations = relations(materials, ({ one }) => ({
  task: one(tasks, {
    fields: [materials.taskId],
    references: [tasks.id],
  }),
}));

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));
