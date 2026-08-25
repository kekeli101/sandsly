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

/** Password-reset secrets are stored only as hashes and become unusable after expiry or redemption. */
export const passwordResetTokens = pgTable("passwordResetTokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  usedAt: timestamp("usedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("password_reset_tokens_user_created_idx").on(table.userId, table.createdAt)]);

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

/** Inventory quantities are stored in thousandths of the selected measurement unit. */
export const inventoryUnitValues = ["g", "ml", "each", "pack"] as const;
export const inventoryUnitEnum = pgEnum("inventory_unit", inventoryUnitValues);
export const inventoryItems = pgTable("inventoryItems", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  unit: inventoryUnitEnum("unit").notNull().default("g"),
  currentQuantityMilliunits: integer("currentQuantityMilliunits").notNull().default(0),
  reorderPointMilliunits: integer("reorderPointMilliunits").notNull().default(0),
  /** Current per-unit cost in pesewas; changes do not rewrite historical order costs. */
  unitCostPesewas: integer("unitCostPesewas").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("inventory_items_name_lower_unique").on(sql`lower(${table.name})`), index("inventory_items_active_idx").on(table.isActive)]);

/** Recipe lines express the measured inventory consumption required for one sold menu item. */
export const productRecipes = pgTable("productRecipes", {
  id: serial("id").primaryKey(),
  productId: varchar("productId", { length: 64 }).notNull().references(() => products.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventoryItemId").notNull().references(() => inventoryItems.id),
  quantityMilliunits: integer("quantityMilliunits").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("product_recipes_product_inventory_unique").on(table.productId, table.inventoryItemId), index("product_recipes_product_idx").on(table.productId)]);

export const inventoryAdjustmentReasonValues = ["opening_count", "purchase", "waste", "correction", "order_usage"] as const;
export const inventoryAdjustmentReasonEnum = pgEnum("inventory_adjustment_reason", inventoryAdjustmentReasonValues);

export const expenseCategoryValues = ["rent", "utilities", "payroll", "marketing", "delivery", "maintenance", "other"] as const;
export const expenseCategoryEnum = pgEnum("expense_category", expenseCategoryValues);

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

export const orderStatusValues = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "completed", "cancelled"] as const;
export const orderStatusEnum = pgEnum("order_status", orderStatusValues);
export const orderTypeValues = ["pickup", "delivery"] as const;
export const orderTypeEnum = pgEnum("order_type", orderTypeValues);
export const paymentMethodValues = ["cash_on_pickup", "cash_on_delivery", "mobile_money", "card"] as const;
export const paymentMethodEnum = pgEnum("payment_method", paymentMethodValues);
export const paymentStatusValues = ["pending", "successful", "failed", "refunded"] as const;
export const paymentStatusEnum = pgEnum("payment_status", paymentStatusValues);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  userId: integer("userId").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  orderType: orderTypeEnum("orderType").notNull().default("pickup"),
  currency: varchar("currency", { length: 3 }).notNull().default("GHS"),
  subtotalPesewas: integer("subtotalPesewas").notNull(),
  deliveryFeePesewas: integer("deliveryFeePesewas").notNull().default(0),
  totalPesewas: integer("totalPesewas").notNull(),
  customerNote: varchar("customerNote", { length: 280 }),
  deliveryPhone: varchar("deliveryPhone", { length: 32 }),
  deliveryAddress: text("deliveryAddress"),
  deliveryInstructions: varchar("deliveryInstructions", { length: 280 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("orders_user_created_idx").on(table.userId, table.createdAt), index("orders_status_created_idx").on(table.status, table.createdAt)]);

/** A payment record remains separate from the operational order state. */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull().references(() => orders.id).unique(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  amountPesewas: integer("amountPesewas").notNull(),
  providerReference: varchar("providerReference", { length: 160 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

/** Append-only status events support staff accountability and customer order tracking. */
export const orderStatusHistory = pgTable("orderStatusHistory", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull().references(() => orders.id),
  previousStatus: orderStatusEnum("previousStatus"),
  nextStatus: orderStatusEnum("nextStatus").notNull(),
  changedByUserId: integer("changedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("order_status_history_order_created_idx").on(table.orderId, table.createdAt)]);

/** Line-item snapshots retain the exact menu data and price at the moment an order is submitted. */
export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull().references(() => orders.id),
  productId: varchar("productId", { length: 64 }).notNull(),
  productName: varchar("productName", { length: 160 }).notNull(),
  unitPricePesewas: integer("unitPricePesewas").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalPesewas: integer("lineTotalPesewas").notNull(),
  /** True only when a recipe-cost snapshot was recorded at checkout. */
  isCosted: boolean("isCosted").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("order_items_order_idx").on(table.orderId)]);

/** Immutable per-order ingredient-cost snapshot used for COGS, independent of later supplier price changes. */
export const orderIngredientUsage = pgTable("orderIngredientUsage", {
  id: serial("id").primaryKey(),
  orderItemId: integer("orderItemId").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventoryItemId").notNull().references(() => inventoryItems.id),
  quantityMilliunits: integer("quantityMilliunits").notNull(),
  unitCostPesewas: integer("unitCostPesewas").notNull(),
  totalCostPesewas: integer("totalCostPesewas").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("order_ingredient_usage_line_inventory_unique").on(table.orderItemId, table.inventoryItemId), index("order_ingredient_usage_inventory_idx").on(table.inventoryItemId)]);

/** Append-only stock movements provide a reconciliable audit trail. */
export const inventoryAdjustments = pgTable("inventoryAdjustments", {
  id: serial("id").primaryKey(),
  inventoryItemId: integer("inventoryItemId").notNull().references(() => inventoryItems.id),
  orderItemId: integer("orderItemId").references(() => orderItems.id, { onDelete: "cascade" }),
  reason: inventoryAdjustmentReasonEnum("reason").notNull(),
  quantityDeltaMilliunits: integer("quantityDeltaMilliunits").notNull(),
  unitCostPesewas: integer("unitCostPesewas"),
  note: varchar("note", { length: 280 }),
  createdByUserId: integer("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("inventory_adjustments_order_line_unique").on(table.orderItemId, table.inventoryItemId), index("inventory_adjustments_inventory_created_idx").on(table.inventoryItemId, table.createdAt)]);

/** Operating expenses are deliberately separate from inventory purchases to avoid double-counting COGS. */
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: expenseCategoryEnum("category").notNull(),
  description: varchar("description", { length: 240 }).notNull(),
  amountPesewas: integer("amountPesewas").notNull(),
  occurredAt: timestamp("occurredAt", { withTimezone: true }).notNull(),
  createdByUserId: integer("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("expenses_occurred_at_idx").on(table.occurredAt), index("expenses_category_occurred_idx").on(table.category, table.occurredAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type OrderStatus = (typeof orderStatusValues)[number];
export type OrderType = (typeof orderTypeValues)[number];
export type PaymentMethod = (typeof paymentMethodValues)[number];
export type PaymentStatus = (typeof paymentStatusValues)[number];
export type InventoryUnit = (typeof inventoryUnitValues)[number];
export type InventoryAdjustmentReason = (typeof inventoryAdjustmentReasonValues)[number];
export type ExpenseCategory = (typeof expenseCategoryValues)[number];
