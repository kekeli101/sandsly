import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core authenticated customer identity. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "kitchen", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const customerProfiles = mysqlTable("customerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  phone: varchar("phone", { length: 32 }),
  defaultAddress: text("defaultAddress"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("customer_profiles_user_unique").on(table.userId)]);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 96 }).notNull(),
  sortOrder: int("sortOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const products = mysqlTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  categoryId: int("categoryId").notNull().references(() => categories.id),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").notNull(),
  /** Integer pesewas to avoid decimal rounding in all checkout calculations. */
  pricePesewas: int("pricePesewas").notNull(),
  imageUrl: text("imageUrl").notNull(),
  badge: varchar("badge", { length: 48 }),
  crunchLevel: int("crunchLevel").notNull().default(0),
  sortOrder: int("sortOrder").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("products_category_active_idx").on(table.categoryId, table.isActive)]);

/** A customer owns one live cart. Checkout clears its items while keeping the cart record reusable. */
export const carts = mysqlTable("carts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("carts_user_unique").on(table.userId)]);

export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  cartId: int("cartId").notNull().references(() => carts.id),
  productId: varchar("productId", { length: 64 }).notNull().references(() => products.id),
  quantity: int("quantity").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("cart_items_cart_product_unique").on(table.cartId, table.productId)]);

export const orderStatusValues = ["pending", "accepted", "preparing", "ready", "completed", "cancelled"] as const;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  status: mysqlEnum("status", orderStatusValues).notNull().default("pending"),
  currency: varchar("currency", { length: 3 }).notNull().default("GHS"),
  subtotalPesewas: int("subtotalPesewas").notNull(),
  deliveryFeePesewas: int("deliveryFeePesewas").notNull().default(0),
  totalPesewas: int("totalPesewas").notNull(),
  customerNote: varchar("customerNote", { length: 280 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("orders_user_created_idx").on(table.userId, table.createdAt), index("orders_status_created_idx").on(table.status, table.createdAt)]);

/** Line-item snapshots retain the exact menu data and price at the moment an order is submitted. */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  productId: varchar("productId", { length: 64 }).notNull(),
  productName: varchar("productName", { length: 160 }).notNull(),
  unitPricePesewas: int("unitPricePesewas").notNull(),
  quantity: int("quantity").notNull(),
  lineTotalPesewas: int("lineTotalPesewas").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("order_items_order_idx").on(table.orderId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type OrderStatus = (typeof orderStatusValues)[number];
