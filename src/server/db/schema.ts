import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  pgEnum,
  uuid,
  uniqueIndex,
  boolean,
  primaryKey,
  serial,
  index,
} from 'drizzle-orm/pg-core';
import { type AdapterAccount } from 'next-auth/adapters';

// --- Enums (Copied from lib) ---

export const quoteStatusEnum = pgEnum('quote_status', ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']);
export const QuoteStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;
export type QuoteStatusType = (typeof QuoteStatus)[keyof typeof QuoteStatus];

export const materialTypeEnum = pgEnum('material_type', ['LUMPSUM', 'ITEMIZED']);
export const MaterialType = { ITEMIZED: 'ITEMIZED', LUMPSUM: 'LUMPSUM' } as const;
export type MaterialTypeType = (typeof MaterialType)[keyof typeof MaterialType];

// export const productCategoryEnum = pgEnum('product_category', ['LUMBER', 'PLUMBING', 'ELECTRICAL', 'PAINT', 'HARDWARE', 'TOOLS', 'OTHER']);
// export const ProductCategory = { LUMBER: 'LUMBER', PLUMBING: 'PLUMBING', ELECTRICAL: 'ELECTRICAL', PAINT: 'PAINT', HARDWARE: 'HARDWARE', TOOLS: 'TOOLS', OTHER: 'OTHER' } as const;
// export type ProductCategoryType = (typeof ProductCategory)[keyof typeof ProductCategory];

export const transactionTypeEnum = pgEnum('transaction_type', ['INCOME', 'EXPENSE']);
export const TransactionType = { INCOME: 'INCOME', EXPENSE: 'EXPENSE' } as const;
export type TransactionTypeType = (typeof TransactionType)[keyof typeof TransactionType];

export const transactionCategoryEnum = pgEnum('transaction_category', [
  'QUOTE_PAYMENT',
  'MATERIALS',
  'LABOR',
  'SUPPLIES',
  'EQUIPMENT',
  'RENT',
  'UTILITIES',
  'OTHER',
]);
export const TransactionCategory = {
  QUOTE_PAYMENT: 'QUOTE_PAYMENT',
  MATERIALS: 'MATERIALS',
  LABOR: 'LABOR',
  SUPPLIES: 'SUPPLIES',
  EQUIPMENT: 'EQUIPMENT',
  RENT: 'RENT',
  UTILITIES: 'UTILITIES',
  OTHER: 'OTHER',
} as const;
export type TransactionCategoryType =
  (typeof TransactionCategory)[keyof typeof TransactionCategory];

// --- Tables (Copied & Merged from lib) ---

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: text('username').unique(),
  hashedPassword: text('hashed_password'),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  emailVerified: timestamp('email_verified'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'set null' }),
  creatorName: varchar('creator_name', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productCategories = pgTable('product_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'set null' }),
  creatorName: varchar('creator_name', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // sequentialId: serial('sequential_id').notNull(), // Decided against adding sequentialId here for now
    creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'set null' }),
    creatorName: varchar('creator_name', { length: 255 }),
    categoryId: uuid('category_id').references(() => productCategories.id, {
      onDelete: 'set null',
    }),
    categoryName: varchar('category_name', { length: 255 }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull().default('0'),
    unit: varchar('unit', { length: 50 }),
    sku: varchar('sku', { length: 100 }),
    manufacturer: varchar('manufacturer', { length: 255 }),
    supplier: varchar('supplier', { length: 255 }),
    location: varchar('location', { length: 255 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    creatorIdIdx: index('products_creator_id_idx').on(table.creatorId),
    createdAtIdx: index('products_created_at_idx').on(table.createdAt),
  })
);

export const quotes = pgTable(
  'quotes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sequentialId: serial('sequential_id').notNull(),
    creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'set null' }),
    creatorName: varchar('creator_name', { length: 255 }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    customerName: varchar('customer_name', { length: 255 }),
    title: varchar('title', { length: 255 }).notNull(),
    status: quoteStatusEnum('status').default('DRAFT').notNull(),
    subtotalTasks: decimal('subtotal_tasks', { precision: 10, scale: 2 }).notNull().default('0'),
    subtotalMaterials: decimal('subtotal_materials', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    complexityCharge: decimal('complexity_charge', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    markupCharge: decimal('markup_charge', { precision: 10, scale: 2 }).notNull().default('0'),
    markupPercentage: decimal('markup_percentage', { precision: 5, scale: 2 })
      .default('10')
      .notNull(),
    grandTotal: decimal('grand_total', { precision: 10, scale: 2 }).notNull().default('0'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    creatorIdIdx: index('quotes_creator_id_idx').on(table.creatorId),
    statusIdx: index('quotes_status_idx').on(table.status),
    createdAtIdx: index('quotes_created_at_idx').on(table.createdAt),
  })
);

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteId: uuid('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  materialType: materialTypeEnum('material_type').notNull().default('ITEMIZED'),
  estimatedMaterialsCostLumpSum: decimal('estimated_materials_cost_lump_sum', {
    precision: 10,
    scale: 2,
  }),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 255 }),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    quoteId: uuid('quote_id').references(() => quotes.id, { onDelete: 'set null' }),
    type: transactionTypeEnum('type').notNull(),
    category: transactionCategoryEnum('category').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    description: text('description'),
    date: timestamp('date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('transactions_user_id_idx').on(table.userId),
  })
);

export const settings = pgTable(
  'settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    companyName: text('company_name').notNull().default(''),
    companyEmail: text('company_email').notNull().default(''),
    companyPhone: text('company_phone'),
    companyAddress: text('company_address'),
    defaultComplexityCharge: decimal('default_complexity_charge', { precision: 5, scale: 2 })
      .notNull()
      .default('0'),
    defaultMarkupCharge: decimal('default_markup_charge', { precision: 5, scale: 2 })
      .notNull()
      .default('0'),
    defaultTaskPrice: decimal('default_task_price', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    defaultMaterialPrice: decimal('default_material_price', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    emailNotifications: boolean('email_notifications').notNull().default(true),
    quoteNotifications: boolean('quote_notifications').notNull().default(true),
    taskNotifications: boolean('task_notifications').notNull().default(true),
    theme: text('theme').notNull().default('system'),
    locale: text('locale').notNull().default('en'),
    currency: text('currency').notNull().default('USD'),
    currencySymbol: text('currency_symbol').notNull().default('$'),
    dateFormat: text('date_format').notNull().default('MM/DD/YYYY'),
    timeFormat: text('time_format').notNull().default('12h'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('settings_user_id_idx').on(table.userId),
  })
);

// --- Auth Tables (Copied from lib) ---

export const sessions = pgTable(
  'session',
  {
    sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdIdx: index('session_user_id_idx').on(table.userId),
  })
);

export const accounts = pgTable(
  'account',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).$type<AdapterAccount['type']>().notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
    userIdIdx: index('account_user_id_idx').on(account.userId),
  })
);

export const verificationTokens = pgTable(
  'verification_token',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// --- Relations (Copied from server/db/schema) ---

// Notes:
// - Removed imports of tables/enums as they are now defined above.
// - Added productCategoriesRelations based on copied table.

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  user: one(users, {
    fields: [quotes.creatorId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [quotes.customerId],
    references: [customers.id],
  }),
  tasks: many(tasks),
  transactions: many(transactions),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  quote: one(quotes, {
    fields: [tasks.quoteId],
    references: [quotes.id],
  }),
  materials: many(materials),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.creatorId],
    references: [users.id],
  }),
  materials: many(materials),
  // Add relation back to productCategories
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  task: one(tasks, {
    fields: [materials.taskId],
    references: [tasks.id],
  }),
  product: one(products, {
    fields: [materials.productId],
    references: [products.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  settings: one(settings),
  createdCustomers: many(customers),
  createdQuotes: many(quotes),
  createdProducts: many(products),
  createdProductCategories: many(productCategories), // Added relation
  transactions: many(transactions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  creator: one(users, {
    fields: [customers.creatorId],
    references: [users.id],
  }),
  quotes: many(quotes),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  quote: one(quotes, {
    fields: [transactions.quoteId],
    references: [quotes.id],
  }),
}));

// Added ProductCategories relations
export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  creator: one(users, {
    fields: [productCategories.creatorId],
    references: [users.id],
  }),
  products: many(products),
}));
