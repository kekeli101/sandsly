import { sql } from "drizzle-orm";
import { boolean, index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

/** Core authenticated customer identity. */
export const userRoleValues = ["user", "kitchen", "admin"] as const;
export const userRoleEnum = pgEnum("user_role", userRoleValues);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`)]);

export const customerProfiles = pgTable("customerProfiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  phone: varchar("phone", { length: 32 }),
  defaultAddress: text("defaultAddress"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("customer_profiles_user_unique").on(table.userId)]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 96 }).notNull(),
  sortOrder: integer("sortOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  categoryId: integer("categoryId").notNull().references(() => categories.id),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").notNull(),
  /** Integer pesewas to avoid decimal rounding in all checkout calculations. */
  pricePesewas: integer("pricePesewas").notNull(),
  imageUrl: text("imageUrl").notNull(),
  badge: varchar("badge", { length: 48 }),
  crunchLevel: integer("crunchLevel").notNull().default(0),
  sortOrder: integer("sortOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("products_category_active_idx").on(table.categoryId, table.isActive)]);

/** A customer owns one live cart. Checkout clears its items while keeping the cart record reusable. */
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("carts_user_unique").on(table.userId)]);

export const cartItems = pgTable("cartItems", {
  id: serial("id").primaryKey(),
  cartId: integer("cartId").notNull().references(() => carts.id),
  productId: varchar("productId", { length: 64 }).notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("cart_items_cart_product_unique").on(table.cartId, table.productId)]);

export const orderStatusValues = ["pending", "accepted", "preparing", "ready", "completed", "cancelled"] as const;
export const orderStatusEnum = pgEnum("order_status", orderStatusValues);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  userId: integer("userId").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  currency: varchar("currency", { length: 3 }).notNull().default("GHS"),
  subtotalPesewas: integer("subtotalPesewas").notNull(),
  deliveryFeePesewas: integer("deliveryFeePesewas").notNull().default(0),
  totalPesewas: integer("totalPesewas").notNull(),
  customerNote: varchar("customerNote", { length: 280 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("orders_user_created_idx").on(table.userId, table.createdAt), index("orders_status_created_idx").on(table.status, table.createdAt)]);

/** Line-item snapshots retain the exact menu data and price at the moment an order is submitted. */
export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull().references(() => orders.id),
  productId: varchar("productId", { length: 64 }).notNull(),
  productName: varchar("productName", { length: 160 }).notNull(),
  unitPricePesewas: integer("unitPricePesewas").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalPesewas: integer("lineTotalPesewas").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("order_items_order_idx").on(table.orderId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type OrderStatus = (typeof orderStatusValues)[number];
