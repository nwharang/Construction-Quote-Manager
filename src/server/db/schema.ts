import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

// Quote status enum
export const quoteStatusEnum = pgEnum("quote_status", ["DRAFT", "SENT", "ACCEPTED", "REJECTED"]);

export const QuoteStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;

export type QuoteStatusType = (typeof QuoteStatus)[keyof typeof QuoteStatus];

// Users table (placeholder for future auth integration)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Quotes table
export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: text("created_by").notNull(),
  projectName: text("project_name").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  notes: text("notes"),
  status: quoteStatusEnum("status").notNull().default("DRAFT"),
  complexityCharge: decimal("complexity_charge", { precision: 10, scale: 2 }).notNull().default("0"),
  markupPercentage: decimal("markup_percentage", { precision: 5, scale: 2 }).notNull().default("20"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Quotes table
export const quotesRelations = relations(quotes, ({ many }) => ({
  tasks: many(tasks),
}));

// Tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  estimatedMaterialsCost: decimal("estimated_materials_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tasks table
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  quote: one(quotes, {
    fields: [tasks.quoteId],
    references: [quotes.id],
  }),
  materials: many(materials),
}));

// Materials table
export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Materials table
export const materialsRelations = relations(materials, ({ one }) => ({
  task: one(tasks, {
    fields: [materials.taskId],
    references: [tasks.id],
  }),
}));

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  quotes: many(quotes),
}));
