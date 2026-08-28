import { drizzle } from "drizzle-orm/postgres-js";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import postgres from "postgres";
import {
  cartItems,
  carts,
  categories,
  customerProfiles,
  expenses,
  inventoryAdjustments,
  inventoryItems,
  orderIngredientUsage,
  type InsertUser,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  productRecipes,
  products,
  type ExpenseCategory,
  type InventoryAdjustmentReason,
  type InventoryUnit,
  type OrderStatus,
  type OrderType,
  type PaymentMethod,
  users,
} from "../drizzle/schema";
import { calculateOrderTotals } from "./storefront-utils";
import { isValidKitchenTransition } from "./kitchen-utils";
import { filterCustomerCatalogProducts } from "./catalog-utils";
import { calculateRecordedProfit } from "./finance-utils";

const DELIVERY_FEE_PESEWAS = 2000;
let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;
const CATALOG_CACHE_TTL_MS = 30_000;
type CatalogResult = {
  categories: Array<{ id: number; slug: string; name: string; sortOrder: number }>;
  products: Array<{ id: string; name: string; description: string; pricePesewas: number; imageUrl: string; badge: string | null; crunchLevel: number; categorySlug: string; categoryName: string; sortOrder: number }>;
};
let catalogCache: { value: CatalogResult; expiresAt: number } | null = null;

export async function getDb() {
  if (!_db) {
    const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
    if (!connectionString) return null;
    try {
      _client = postgres(connectionString, { prepare: false, max: 5 });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _client = null;
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await requireDb();
  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).orderBy(asc(users.id)).limit(1);
  return result[0];
}

export async function createLocalUser(user: InsertUser) {
  const db = await requireDb();
  await db.insert(users).values(user);
  return getUserByOpenId(user.openId);
}

export async function touchUser(id: number) {
  const db = await requireDb();
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function getDevelopmentDemoUser() {
  if (process.env.NODE_ENV === "production") throw new Error("Demo authentication is disabled in production");
  const openId = "development-demo-customer";
  await upsertUser({ openId, name: "Crunch Bite Kitchen", email: "demo@crunchbite.local", loginMethod: "development-demo", role: "kitchen" });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Unable to create the development demo account");
  return user;
}

export async function getDevelopmentDemoCustomer() {
  if (process.env.NODE_ENV === "production") throw new Error("Demo authentication is disabled in production");
  const openId = "development-demo-customer-user";
  await upsertUser({ openId, name: "Crunch Bite Customer", email: "customer-demo@crunchbite.local", loginMethod: "development-demo", role: "user" });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Unable to create the development customer account");
  return user;
}

export async function listCatalog(): Promise<CatalogResult> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache.value;
  const db = await requireDb();
  const [categoryRows, productRows] = await Promise.all([
    db.select({ id: categories.id, slug: categories.slug, name: categories.name, sortOrder: categories.sortOrder, isActive: categories.isActive })
      .from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder),
    db.select({
      id: products.id, name: products.name, description: products.description, pricePesewas: products.pricePesewas,
      imageUrl: products.imageUrl, badge: products.badge, crunchLevel: products.crunchLevel,
      categorySlug: categories.slug, categoryName: categories.name, sortOrder: products.sortOrder,
      productIsActive: products.isActive, categoryIsActive: categories.isActive,
    }).from(products).innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.isActive, true), eq(categories.isActive, true)))
      .orderBy(categories.sortOrder, products.sortOrder),
  ]);
  const value = {
    categories: categoryRows.filter((category) => category.isActive).map(({ isActive: _isActive, ...category }) => category),
    products: filterCustomerCatalogProducts(productRows.map(({ productIsActive, categoryIsActive, ...product }) => ({ product, productIsActive, categoryIsActive }))),
  };
  catalogCache = { value, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS };
  return value;
}

function invalidateCatalogCache() {
  catalogCache = null;
}

export async function listMenuManagementData() {
  const db = await requireDb();
  const [categoryRows, productRows] = await Promise.all([
    db.select({ id: categories.id, slug: categories.slug, name: categories.name, sortOrder: categories.sortOrder })
      .from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder),
    db.select({
      id: products.id, categoryId: products.categoryId, name: products.name, description: products.description,
      pricePesewas: products.pricePesewas, imageUrl: products.imageUrl, badge: products.badge,
      crunchLevel: products.crunchLevel, sortOrder: products.sortOrder, isActive: products.isActive,
      categoryName: categories.name,
    }).from(products).innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(categories.sortOrder, products.sortOrder, products.name),
  ]);
  return { categories: categoryRows, products: productRows };
}

export async function createMenuProduct(input: {
  id: string; categoryId: number; name: string; description: string; pricePesewas: number;
  imageUrl: string; badge?: string | null; crunchLevel: number; sortOrder: number;
}) {
  const db = await requireDb();
  const [created] = await db.insert(products).values({ ...input, badge: input.badge || null }).returning();
  invalidateCatalogCache();
  return created;
}

export async function updateMenuProduct(productId: string, input: Partial<{
  categoryId: number; name: string; description: string; pricePesewas: number; imageUrl: string;
  badge: string | null; crunchLevel: number; sortOrder: number; isActive: boolean;
}>) {
  const db = await requireDb();
  const [updated] = await db.update(products).set({ ...input, updatedAt: new Date() }).where(eq(products.id, productId)).returning();
  if (!updated) throw new Error("Menu item not found");
  invalidateCatalogCache();
  return updated;
}

export async function setMenuProductActive(productId: string, isActive: boolean) {
  return updateMenuProduct(productId, { isActive });
}

export type InventoryItemInput = {
  name: string;
  unit: InventoryUnit;
  currentQuantityMilliunits: number;
  reorderPointMilliunits: number;
  unitCostPesewas: number;
};

/** Manager-only setup data; quantities remain in milliunits to keep stock and COGS integer-safe. */
export async function listFinanceManagementData() {
  const db = await requireDb();
  const inventory = await db.select({
    id: inventoryItems.id, name: inventoryItems.name, unit: inventoryItems.unit,
    currentQuantityMilliunits: inventoryItems.currentQuantityMilliunits,
    reorderPointMilliunits: inventoryItems.reorderPointMilliunits,
    unitCostPesewas: inventoryItems.unitCostPesewas, isActive: inventoryItems.isActive,
  }).from(inventoryItems).orderBy(asc(inventoryItems.name));
  const recipes = await db.select({
    productId: productRecipes.productId, productName: products.name, inventoryItemId: productRecipes.inventoryItemId,
    inventoryItemName: inventoryItems.name, unit: inventoryItems.unit, quantityMilliunits: productRecipes.quantityMilliunits,
  }).from(productRecipes).innerJoin(products, eq(productRecipes.productId, products.id))
    .innerJoin(inventoryItems, eq(productRecipes.inventoryItemId, inventoryItems.id)).orderBy(asc(products.name), asc(inventoryItems.name));
  const productsForRecipes = await db.select({ id: products.id, name: products.name, isActive: products.isActive })
    .from(products).orderBy(asc(products.name));
  const recentExpenses = await db.select({
    id: expenses.id, category: expenses.category, description: expenses.description, amountPesewas: expenses.amountPesewas, occurredAt: expenses.occurredAt,
  }).from(expenses).orderBy(desc(expenses.occurredAt), desc(expenses.id)).limit(20);
  return { inventory, recipes, products: productsForRecipes, recentExpenses };
}

export async function createInventoryItem(input: InventoryItemInput, createdByUserId: number) {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const [item] = await tx.insert(inventoryItems).values(input).returning();
    if (input.currentQuantityMilliunits !== 0) {
      await tx.insert(inventoryAdjustments).values({
        inventoryItemId: item.id, reason: "opening_count", quantityDeltaMilliunits: input.currentQuantityMilliunits,
        unitCostPesewas: input.unitCostPesewas, note: "Opening inventory count", createdByUserId,
      });
    }
    return item;
  });
}

export async function recordInventoryAdjustment(input: {
  inventoryItemId: number;
  reason: Exclude<InventoryAdjustmentReason, "order_usage">;
  quantityDeltaMilliunits: number;
  unitCostPesewas?: number;
  note?: string;
}, createdByUserId: number) {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const item = (await tx.select().from(inventoryItems).where(eq(inventoryItems.id, input.inventoryItemId)).limit(1))[0];
    if (!item) throw new Error("Inventory item not found");
    const [updated] = await tx.update(inventoryItems).set({
      currentQuantityMilliunits: sql`${inventoryItems.currentQuantityMilliunits} + ${input.quantityDeltaMilliunits}`,
      unitCostPesewas: input.unitCostPesewas ?? item.unitCostPesewas,
      updatedAt: new Date(),
    }).where(eq(inventoryItems.id, input.inventoryItemId)).returning();
    await tx.insert(inventoryAdjustments).values({
      inventoryItemId: input.inventoryItemId, reason: input.reason, quantityDeltaMilliunits: input.quantityDeltaMilliunits,
      unitCostPesewas: input.unitCostPesewas ?? null, note: input.note?.trim() || null, createdByUserId,
    });
    return updated;
  });
}

export async function replaceProductRecipe(productId: string, ingredients: Array<{ inventoryItemId: number; quantityMilliunits: number }>) {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    await tx.delete(productRecipes).where(eq(productRecipes.productId, productId));
    if (ingredients.length) await tx.insert(productRecipes).values(ingredients.map((ingredient) => ({ productId, ...ingredient })));
    return { productId, ingredientCount: ingredients.length };
  });
}

export async function createExpense(input: { category: ExpenseCategory; description: string; amountPesewas: number; occurredAt: Date }, createdByUserId: number) {
  const db = await requireDb();
  const [expense] = await db.insert(expenses).values({ ...input, createdByUserId }).returning();
  return expense;
}

async function getOrCreateCart(userId: number) {
  const db = await requireDb();
  let cart = (await db.select().from(carts).where(eq(carts.userId, userId)).limit(1))[0];
  if (!cart) {
    await db.insert(carts).values({ userId });
    cart = (await db.select().from(carts).where(eq(carts.userId, userId)).limit(1))[0];
  }
  if (!cart) throw new Error("Unable to create cart");
  return cart;
}

export async function getCartForUser(userId: number) {
  const db = await requireDb();
  const cart = await getOrCreateCart(userId);
  const rows = await db.select({
    id: products.id, name: products.name, description: products.description, pricePesewas: products.pricePesewas,
    imageUrl: products.imageUrl, badge: products.badge, crunchLevel: products.crunchLevel, quantity: cartItems.quantity,
  }).from(cartItems).innerJoin(products, eq(cartItems.productId, products.id)).where(eq(cartItems.cartId, cart.id));
  const totals = calculateOrderTotals(rows.map((row) => ({ unitPricePesewas: row.pricePesewas, quantity: row.quantity })), DELIVERY_FEE_PESEWAS);
  return { items: rows, ...totals };
}

export async function addCartItem(userId: number, productId: string, quantity: number) {
  const db = await requireDb();
  const product = (await db.select({ id: products.id }).from(products).where(and(eq(products.id, productId), eq(products.isActive, true))).limit(1))[0];
  if (!product) throw new Error("This menu item is unavailable");
  const cart = await getOrCreateCart(userId);
  await db.insert(cartItems).values({ cartId: cart.id, productId, quantity }).onConflictDoUpdate({
    target: [cartItems.cartId, cartItems.productId],
    set: { quantity: sql`${cartItems.quantity} + ${quantity}` },
  });
  return getCartForUser(userId);
}

export async function setCartItemQuantity(userId: number, productId: string, quantity: number) {
  const db = await requireDb();
  const cart = await getOrCreateCart(userId);
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));
  } else {
    await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));
  }
  return getCartForUser(userId);
}

export async function clearCartForUser(userId: number) {
  const db = await requireDb();
  const cart = await getOrCreateCart(userId);
  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  return { success: true } as const;
}

export type CheckoutInput = {
  customerNote?: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  deliveryPhone?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
};

const ORDER_NUMBER_PREFIX = "CB";
const ORDER_NUMBER_TIME_ZONE = "Africa/Accra";
const MAX_ORDER_NUMBER_RETRIES = 4;
const DAILY_ORDER_NUMBER_PATTERN = new RegExp(`^${ORDER_NUMBER_PREFIX}-(\\d{8})-(\\d+)$`);

export function getGhanaOrderDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ORDER_NUMBER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}`;
}

export function formatDailyOrderNumber(dateKey: string, sequence: number): string {
  if (!/^\d{8}$/.test(dateKey)) throw new Error("Order date key must use YYYYMMDD format");
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error("Order sequence must be a positive integer");
  return `${ORDER_NUMBER_PREFIX}-${dateKey}-${String(sequence).padStart(3, "0")}`;
}

export function getNextDailyOrderSequence(orderNumbers: readonly string[], dateKey: string): number {
  let highest = 0;
  for (const orderNumber of orderNumbers) {
    const match = DAILY_ORDER_NUMBER_PATTERN.exec(orderNumber);
    if (match?.[1] !== dateKey) continue;
    const sequence = Number(match[2]);
    if (Number.isSafeInteger(sequence)) highest = Math.max(highest, sequence);
  }
  return highest + 1;
}

function isOrderNumberUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; constraint?: unknown; message?: unknown };
  const code = String(record.code ?? "");
  const details = `${String(record.constraint ?? "")} ${String(record.message ?? "")}`.toLowerCase();
  return (code === "23505" || code === "1062") && (details.includes("ordernumber") || details.includes("order_number"));
}

export async function createOrderFromCart(userId: number, input: CheckoutInput) {
  const db = await requireDb();
  const cart = await getOrCreateCart(userId);
  let lastCollision: unknown;
  for (let attempt = 0; attempt < MAX_ORDER_NUMBER_RETRIES; attempt += 1) {
    try {
      return await db.transaction(async (tx) => {
    const lines = await tx.select({
      id: products.id, name: products.name, pricePesewas: products.pricePesewas, quantity: cartItems.quantity,
    }).from(cartItems).innerJoin(products, eq(cartItems.productId, products.id)).where(and(eq(cartItems.cartId, cart.id), eq(products.isActive, true)));
    if (!lines.length) throw new Error("Your bag is empty");
    if (input.orderType === "delivery" && (!input.deliveryPhone?.trim() || !input.deliveryAddress?.trim())) {
      throw new Error("Delivery phone and address are required for delivery orders");
    }
    if (input.orderType === "pickup" && input.paymentMethod === "cash_on_delivery") {
      throw new Error("Cash on delivery is only available for delivery orders");
    }
    if (input.orderType === "delivery" && input.paymentMethod === "cash_on_pickup") {
      throw new Error("Cash on pickup is only available for pickup orders");
    }
    const deliveryFee = input.orderType === "delivery" ? DELIVERY_FEE_PESEWAS : 0;
    const totals = calculateOrderTotals(lines.map((line) => ({ unitPricePesewas: line.pricePesewas, quantity: line.quantity })), deliveryFee);
    const dateKey = getGhanaOrderDateKey(new Date());
    const existingOrderNumbers = await tx.select({ orderNumber: orders.orderNumber }).from(orders)
      .where(sql`${orders.orderNumber} LIKE ${`${ORDER_NUMBER_PREFIX}-${dateKey}-%`}`);
    const orderNumber = formatDailyOrderNumber(dateKey, getNextDailyOrderSequence(existingOrderNumbers.map((row) => row.orderNumber), dateKey));
    const [created] = await tx.insert(orders).values({
      orderNumber, userId, status: "pending", orderType: input.orderType, currency: "GHS", ...totals,
      customerNote: input.customerNote?.trim() || null,
      deliveryPhone: input.orderType === "delivery" ? input.deliveryPhone?.trim() || null : null,
      deliveryAddress: input.orderType === "delivery" ? input.deliveryAddress?.trim() || null : null,
      deliveryInstructions: input.orderType === "delivery" ? input.deliveryInstructions?.trim() || null : null,
    }).returning({ id: orders.id });
    await tx.insert(payments).values({ orderId: created.id, method: input.paymentMethod, status: "pending", amountPesewas: totals.totalPesewas });
    await tx.insert(orderStatusHistory).values({ orderId: created.id, previousStatus: null, nextStatus: "pending", changedByUserId: userId });
    const recipeRows = await tx.select({
      productId: productRecipes.productId, inventoryItemId: productRecipes.inventoryItemId,
      quantityMilliunits: productRecipes.quantityMilliunits, unitCostPesewas: inventoryItems.unitCostPesewas,
    }).from(productRecipes).innerJoin(inventoryItems, eq(productRecipes.inventoryItemId, inventoryItems.id))
      .where(inArray(productRecipes.productId, lines.map((line) => line.id)));
    const recipeByProduct = new Map<string, typeof recipeRows>();
    for (const recipe of recipeRows) recipeByProduct.set(recipe.productId, [...(recipeByProduct.get(recipe.productId) ?? []), recipe]);
    const insertedOrderItems = await tx.insert(orderItems).values(lines.map((line) => ({
      orderId: created.id, productId: line.id, productName: line.name, unitPricePesewas: line.pricePesewas,
      quantity: line.quantity, lineTotalPesewas: line.pricePesewas * line.quantity,
      isCosted: (recipeByProduct.get(line.id)?.length ?? 0) > 0,
    }))).returning({ id: orderItems.id, productId: orderItems.productId, quantity: orderItems.quantity, isCosted: orderItems.isCosted });
    const usageSnapshots = insertedOrderItems.flatMap((line) => (recipeByProduct.get(line.productId) ?? []).map((recipe) => {
      const quantityMilliunits = recipe.quantityMilliunits * line.quantity;
      return {
        orderItemId: line.id, inventoryItemId: recipe.inventoryItemId, quantityMilliunits,
        unitCostPesewas: recipe.unitCostPesewas,
        totalCostPesewas: Math.round(recipe.unitCostPesewas * quantityMilliunits / 1000),
      };
    }));
    if (usageSnapshots.length) await tx.insert(orderIngredientUsage).values(usageSnapshots);
    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    return {
      id: created.id,
      orderNumber,
      status: "pending" as const,
      orderType: input.orderType,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending" as const,
      ...totals,
      items: lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        unitPricePesewas: line.pricePesewas,
        lineTotalPesewas: line.pricePesewas * line.quantity,
      })),
      customerNote: input.customerNote?.trim() || undefined,
      deliveryPhone: input.orderType === "delivery" ? input.deliveryPhone?.trim() || undefined : undefined,
      deliveryAddress: input.orderType === "delivery" ? input.deliveryAddress?.trim() || undefined : undefined,
      deliveryInstructions: input.orderType === "delivery" ? input.deliveryInstructions?.trim() || undefined : undefined,
    };
      });
    } catch (error) {
      if (!isOrderNumberUniqueViolation(error) || attempt === MAX_ORDER_NUMBER_RETRIES - 1) throw error;
      lastCollision = error;
    }
  }
  throw lastCollision ?? new Error("Unable to allocate an order number");
}

export async function attachPaystackReference(orderId: number, reference: string) {
  const db = await requireDb();
  const [payment] = await db.update(payments).set({ providerReference: reference, updatedAt: new Date() })
    .where(and(eq(payments.orderId, orderId), eq(payments.status, "pending"))).returning();
  if (!payment) throw new Error("This order is not eligible for Paystack checkout");
  return payment;
}

export async function getPaystackPaymentForUser(userId: number, reference: string) {
  const db = await requireDb();
  return (await db.select({
    paymentId: payments.id, orderId: orders.id, orderNumber: orders.orderNumber, amountPesewas: payments.amountPesewas,
    status: payments.status, method: payments.method, reference: payments.providerReference,
  }).from(payments).innerJoin(orders, eq(payments.orderId, orders.id))
    .where(and(eq(orders.userId, userId), eq(payments.providerReference, reference))).limit(1))[0];
}

export async function getPaystackPaymentForWebhook(reference: string) {
  const db = await requireDb();
  return (await db.select({
    paymentId: payments.id, orderId: orders.id, orderNumber: orders.orderNumber, amountPesewas: payments.amountPesewas,
    status: payments.status, method: payments.method, reference: payments.providerReference,
  }).from(payments).innerJoin(orders, eq(payments.orderId, orders.id))
    .where(and(eq(payments.providerReference, reference), inArray(payments.method, ["mobile_money", "card"]))).limit(1))[0];
}

export async function getPendingOnlinePaymentForUser(userId: number, orderId: number) {
  const db = await requireDb();
  return (await db.select({
    paymentId: payments.id, orderId: orders.id, orderNumber: orders.orderNumber, amountPesewas: payments.amountPesewas,
    status: payments.status, method: payments.method,
  }).from(payments).innerJoin(orders, eq(payments.orderId, orders.id))
    .where(and(eq(orders.userId, userId), eq(orders.id, orderId), eq(payments.status, "pending"), inArray(payments.method, ["mobile_money", "card"]))).limit(1))[0];
}

export async function recordVerifiedPaystackPayment(paymentId: number, reference: string) {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const payment = (await tx.select().from(payments).where(and(eq(payments.id, paymentId), eq(payments.providerReference, reference))).limit(1))[0];
    if (!payment) throw new Error("Payment record not found");
    if (payment.status === "successful") return payment;
    const [updated] = await tx.update(payments).set({ status: "successful", updatedAt: new Date() }).where(eq(payments.id, paymentId)).returning();
    return updated;
  });
}

export async function recordVerifiedPaystackPaymentOnce(paymentId: number, reference: string) {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(payments).set({ status: "successful", updatedAt: new Date() })
      .where(and(eq(payments.id, paymentId), eq(payments.providerReference, reference), eq(payments.status, "pending"))).returning();
    if (updated) return { payment: updated, newlySuccessful: true };
    const payment = (await tx.select().from(payments).where(and(eq(payments.id, paymentId), eq(payments.providerReference, reference))).limit(1))[0];
    if (!payment) throw new Error("Payment record not found");
    return { payment, newlySuccessful: false };
  });
}

export async function markPaystackPaymentFailed(paymentId: number, reference: string) {
  const db = await requireDb();
  const [updated] = await db.update(payments).set({ status: "failed", updatedAt: new Date() })
    .where(and(eq(payments.id, paymentId), eq(payments.providerReference, reference), eq(payments.status, "pending"))).returning();
  return updated;
}

export async function getOrderForTelegramNotification(orderId: number) {
  const db = await requireDb();
  const [order] = await db.select({
    id: orders.id, orderNumber: orders.orderNumber, status: orders.status, customerName: users.name,
    subtotalPesewas: orders.subtotalPesewas, deliveryFeePesewas: orders.deliveryFeePesewas, totalPesewas: orders.totalPesewas,
    customerNote: orders.customerNote, orderType: orders.orderType, paymentMethod: payments.method, paymentStatus: payments.status,
    deliveryPhone: orders.deliveryPhone, deliveryAddress: orders.deliveryAddress, deliveryInstructions: orders.deliveryInstructions,
  }).from(orders).innerJoin(users, eq(orders.userId, users.id)).leftJoin(payments, eq(payments.orderId, orders.id)).where(eq(orders.id, orderId)).limit(1);
  if (!order) return undefined;
  const items = await db.select({ name: orderItems.productName, quantity: orderItems.quantity, unitPricePesewas: orderItems.unitPricePesewas, lineTotalPesewas: orderItems.lineTotalPesewas })
    .from(orderItems).where(eq(orderItems.orderId, orderId));
  return {
    ...order,
    customerName: order.customerName ?? "Customer",
    paymentMethod: order.paymentMethod ?? "cash_on_pickup",
    paymentStatus: order.paymentStatus ?? "pending",
    customerNote: order.customerNote ?? undefined,
    deliveryPhone: order.deliveryPhone ?? undefined,
    deliveryAddress: order.deliveryAddress ?? undefined,
    deliveryInstructions: order.deliveryInstructions ?? undefined,
    items,
  };
}

export async function listOrdersForUser(userId: number) {
  const db = await requireDb();
  const orderRows = await db.select({
    id: orders.id, orderNumber: orders.orderNumber, status: orders.status, orderType: orders.orderType,
    totalPesewas: orders.totalPesewas, deliveryFeePesewas: orders.deliveryFeePesewas, customerNote: orders.customerNote,
    deliveryPhone: orders.deliveryPhone, deliveryAddress: orders.deliveryAddress, deliveryInstructions: orders.deliveryInstructions,
    createdAt: orders.createdAt, paymentMethod: payments.method, paymentStatus: payments.status,
  }).from(orders).leftJoin(payments, eq(payments.orderId, orders.id)).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  if (!orderRows.length) return [];
  const ids = orderRows.map((order) => order.id);
  const [items, history] = await Promise.all([
    db.select({ orderId: orderItems.orderId, productName: orderItems.productName, quantity: orderItems.quantity, lineTotalPesewas: orderItems.lineTotalPesewas })
      .from(orderItems).where(inArray(orderItems.orderId, ids)),
    db.select({ orderId: orderStatusHistory.orderId, previousStatus: orderStatusHistory.previousStatus, nextStatus: orderStatusHistory.nextStatus, createdAt: orderStatusHistory.createdAt })
      .from(orderStatusHistory).where(inArray(orderStatusHistory.orderId, ids)).orderBy(asc(orderStatusHistory.createdAt)),
  ]);
  return orderRows.map((order) => ({
    ...order,
    paymentMethod: order.paymentMethod ?? "cash_on_pickup",
    paymentStatus: order.paymentStatus ?? "pending",
    items: items.filter((item) => item.orderId === order.id),
    history: history.filter((event) => event.orderId === order.id),
  }));
}

export async function getCustomerProfile(userId: number) {
  const db = await requireDb();
  return (await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId)).limit(1))[0] ?? null;
}

export async function saveCustomerProfile(userId: number, phone?: string, defaultAddress?: string) {
  const db = await requireDb();
  await db.insert(customerProfiles).values({ userId, phone: phone || null, defaultAddress: defaultAddress || null })
    .onConflictDoUpdate({ target: customerProfiles.userId, set: { phone: phone || null, defaultAddress: defaultAddress || null, updatedAt: new Date() } });
  return getCustomerProfile(userId);
}

export async function saveCustomerAccountDetails(userId: number, input: { displayName: string; phone?: string; defaultAddress?: string }) {
  const db = await requireDb();
  const displayName = input.displayName.trim();
  const phone = input.phone?.trim() || null;
  const defaultAddress = input.defaultAddress?.trim() || null;
  return db.transaction(async (tx) => {
    await tx.update(users).set({ name: displayName, updatedAt: new Date() }).where(eq(users.id, userId));
    await tx.insert(customerProfiles).values({ userId, phone, defaultAddress })
      .onConflictDoUpdate({ target: customerProfiles.userId, set: { phone, defaultAddress, updatedAt: new Date() } });
    return { displayName, phone, defaultAddress };
  });
}

export async function listRecentOrdersForAdmin() {
  const db = await requireDb();
  return db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, orderType: orders.orderType, totalPesewas: orders.totalPesewas, createdAt: orders.createdAt, customerName: users.name, paymentMethod: payments.method, paymentStatus: payments.status })
    .from(orders).innerJoin(users, eq(orders.userId, users.id)).leftJoin(payments, eq(payments.orderId, orders.id)).orderBy(desc(orders.createdAt)).limit(50);
}

export async function getAdminDashboardData() {
  const db = await requireDb();
  const [summary] = await db.select({
    totalOrders: sql<number>`count(*)::int`,
    pendingOrders: sql<number>`count(*) filter (where ${orders.status} in ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'))::int`,
    completedOrders: sql<number>`count(*) filter (where ${orders.status} in ('completed', 'delivered'))::int`,
    totalSalesPesewas: sql<number>`coalesce(sum(${orders.totalPesewas}) filter (where ${orders.status} in ('completed', 'delivered')), 0)::int`,
  }).from(orders);
  const [customerCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "user"));
  const popularItems = await db.select({
    name: orderItems.productName,
    quantity: sql<number>`sum(${orderItems.quantity})::int`,
  }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(inArray(orders.status, ["completed", "delivered"]))
    .groupBy(orderItems.productName).orderBy(desc(sql`sum(${orderItems.quantity})`)).limit(5);
  return { summary: { ...summary, customerCount: customerCount.count }, popularItems, recentOrders: await listRecentOrdersForAdmin() };
}

/**
 * Returns the read-only management snapshot used by the owner/manager console.
 *
 * Cash orders are intentionally shown as operational sales awaiting reconciliation,
 * not as automatically settled cash. Online collections are based only on the
 * separately persisted Paystack payment status.
 */
export async function getManagerConsoleData() {
  const db = await requireDb();
  const fulfilledStatuses = ["completed", "delivered"] as const;
  const activeStatuses = ["pending", "accepted", "preparing", "ready", "out_for_delivery"] as const;
  // The free Render instance and direct Supabase connection run with a deliberately
  // small connection budget. Execute these short aggregates in sequence so an
  // owner report cannot leave queued connections waiting indefinitely.
  const orderSummary = await db.select({
      totalOrders: sql<number>`count(*)::int`,
      todayOrders: sql<number>`count(*) filter (where ${orders.createdAt} >= date_trunc('day', now()))::int`,
      activeOrders: sql<number>`count(*) filter (where ${orders.status} in ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'))::int`,
      fulfilledOrders: sql<number>`count(*) filter (where ${orders.status} in ('completed', 'delivered'))::int`,
      cancelledOrders: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`,
      fulfilledSalesPesewas: sql<number>`coalesce(sum(${orders.totalPesewas}) filter (where ${orders.status} in ('completed', 'delivered')), 0)::int`,
      todayFulfilledSalesPesewas: sql<number>`coalesce(sum(${orders.totalPesewas}) filter (where ${orders.status} in ('completed', 'delivered') and ${orders.updatedAt} >= date_trunc('day', now())), 0)::int`,
    }).from(orders);
  const customerSummary = await db.select({ customerCount: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "user"));
  const paymentSummary = await db.select({
      onlineCollectedPesewas: sql<number>`coalesce(sum(${payments.amountPesewas}) filter (where ${payments.status} = 'successful' and ${payments.method} in ('card', 'mobile_money')), 0)::int`,
      pendingOnlinePesewas: sql<number>`coalesce(sum(${payments.amountPesewas}) filter (where ${payments.status} = 'pending' and ${payments.method} in ('card', 'mobile_money')), 0)::int`,
      pendingOnlineCount: sql<number>`count(*) filter (where ${payments.status} = 'pending' and ${payments.method} in ('card', 'mobile_money'))::int`,
      failedOrRefundedOnlinePesewas: sql<number>`coalesce(sum(${payments.amountPesewas}) filter (where ${payments.status} in ('failed', 'refunded') and ${payments.method} in ('card', 'mobile_money')), 0)::int`,
      failedOrRefundedOnlineCount: sql<number>`count(*) filter (where ${payments.status} in ('failed', 'refunded') and ${payments.method} in ('card', 'mobile_money'))::int`,
      cashFulfilledToReconcilePesewas: sql<number>`coalesce(sum(${payments.amountPesewas}) filter (where ${payments.method} in ('cash_on_pickup', 'cash_on_delivery') and ${orders.status} in ('completed', 'delivered')), 0)::int`,
      cashFulfilledToReconcileCount: sql<number>`count(*) filter (where ${payments.method} in ('cash_on_pickup', 'cash_on_delivery') and ${orders.status} in ('completed', 'delivered'))::int`,
    }).from(payments).innerJoin(orders, eq(payments.orderId, orders.id));
  const menuSummary = await db.select({
      activeProducts: sql<number>`count(*) filter (where ${products.isActive} = true)::int`,
      inactiveProducts: sql<number>`count(*) filter (where ${products.isActive} = false)::int`,
    }).from(products);
  const costCoverage = await db.select({
      costedMenuRevenuePesewas: sql<number>`coalesce(sum(${orderItems.lineTotalPesewas}) filter (where ${orderItems.isCosted} = true), 0)::int`,
      uncostedMenuRevenuePesewas: sql<number>`coalesce(sum(${orderItems.lineTotalPesewas}) filter (where ${orderItems.isCosted} = false), 0)::int`,
    }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(inArray(orders.status, fulfilledStatuses));
  const cogsSummary = await db.select({
      cogsPesewas: sql<number>`coalesce(sum(${orderIngredientUsage.totalCostPesewas}), 0)::int`,
    }).from(orderIngredientUsage).innerJoin(orderItems, eq(orderIngredientUsage.orderItemId, orderItems.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id)).where(inArray(orders.status, fulfilledStatuses));
  const expenseSummary = await db.select({ totalExpensePesewas: sql<number>`coalesce(sum(${expenses.amountPesewas}), 0)::int` }).from(expenses);
  const wasteSummary = await db.select({
      inventoryWastePesewas: sql<number>`coalesce(sum(round(-${inventoryAdjustments.quantityDeltaMilliunits} * ${inventoryAdjustments.unitCostPesewas} / 1000.0)), 0)::int`,
    }).from(inventoryAdjustments).where(and(eq(inventoryAdjustments.reason, "waste"), sql`${inventoryAdjustments.quantityDeltaMilliunits} < 0`));
  const expenseBreakdown = await db.select({
      category: expenses.category, amountPesewas: sql<number>`coalesce(sum(${expenses.amountPesewas}), 0)::int`,
    }).from(expenses).groupBy(expenses.category).orderBy(desc(sql`sum(${expenses.amountPesewas})`));
  const inventorySummary = await db.select({
      lowStockCount: sql<number>`count(*) filter (where ${inventoryItems.isActive} = true and ${inventoryItems.reorderPointMilliunits} > 0 and ${inventoryItems.currentQuantityMilliunits} <= ${inventoryItems.reorderPointMilliunits})::int`,
      inventoryValuePesewas: sql<number>`coalesce(sum(round(${inventoryItems.currentQuantityMilliunits} * ${inventoryItems.unitCostPesewas} / 1000.0)), 0)::int`,
    }).from(inventoryItems);
  const paymentBreakdown = await db.select({
      method: payments.method,
      status: payments.status,
      orderCount: sql<number>`count(*)::int`,
      amountPesewas: sql<number>`coalesce(sum(${payments.amountPesewas}), 0)::int`,
    }).from(payments).groupBy(payments.method, payments.status);
  const fulfillmentBreakdown = await db.select({
      status: orders.status,
      orderCount: sql<number>`count(*)::int`,
      totalPesewas: sql<number>`coalesce(sum(${orders.totalPesewas}), 0)::int`,
    }).from(orders).groupBy(orders.status);
  const topItems = await db.select({
      name: orderItems.productName,
      quantity: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      revenuePesewas: sql<number>`coalesce(sum(${orderItems.lineTotalPesewas}), 0)::int`,
      orderCount: sql<number>`count(distinct ${orderItems.orderId})::int`,
    }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(inArray(orders.status, fulfilledStatuses)).groupBy(orderItems.productName)
      .orderBy(desc(sql`sum(${orderItems.lineTotalPesewas})`)).limit(8);
  const dailySales = await db.select({
      day: sql<string>`to_char(date_trunc('day', ${orders.updatedAt}), 'Mon DD')`,
      orderCount: sql<number>`count(*)::int`,
      revenuePesewas: sql<number>`coalesce(sum(${orders.totalPesewas}), 0)::int`,
    }).from(orders).where(and(inArray(orders.status, fulfilledStatuses), sql`${orders.updatedAt} >= now() - interval '6 days'`))
      .groupBy(sql`date_trunc('day', ${orders.updatedAt})`).orderBy(sql`date_trunc('day', ${orders.updatedAt})`);
  const recentOrders = await listRecentOrdersForAdmin();
  const recentExpenses = await db.select({ id: expenses.id, category: expenses.category, description: expenses.description, amountPesewas: expenses.amountPesewas, occurredAt: expenses.occurredAt })
    .from(expenses).orderBy(desc(expenses.occurredAt), desc(expenses.id)).limit(5);
  const coveredMenuRevenue = costCoverage[0]?.costedMenuRevenuePesewas ?? 0;
  const uncostedMenuRevenue = costCoverage[0]?.uncostedMenuRevenuePesewas ?? 0;
  const fulfilledSales = orderSummary[0]?.fulfilledSalesPesewas ?? 0;
  const cogs = cogsSummary[0]?.cogsPesewas ?? 0;
  const operatingExpenses = expenseSummary[0]?.totalExpensePesewas ?? 0;
  const recordedProfit = calculateRecordedProfit({
    fulfilledSalesPesewas: fulfilledSales,
    recipeCogsPesewas: cogs,
    inventoryWastePesewas: wasteSummary[0]?.inventoryWastePesewas ?? 0,
    operatingExpensesPesewas: operatingExpenses,
    uncostedMenuRevenuePesewas: uncostedMenuRevenue,
  });

  return {
    summary: {
      ...orderSummary[0],
      customerCount: customerSummary[0]?.customerCount ?? 0,
      activeProducts: menuSummary[0]?.activeProducts ?? 0,
      inactiveProducts: menuSummary[0]?.inactiveProducts ?? 0,
    },
    finance: paymentSummary[0] ?? {
      onlineCollectedPesewas: 0, pendingOnlinePesewas: 0, pendingOnlineCount: 0,
      failedOrRefundedOnlinePesewas: 0, failedOrRefundedOnlineCount: 0,
      cashFulfilledToReconcilePesewas: 0, cashFulfilledToReconcileCount: 0,
    },
    profit: {
      cogsPesewas: cogs,
      costedMenuRevenuePesewas: coveredMenuRevenue,
      uncostedMenuRevenuePesewas: uncostedMenuRevenue,
      operatingExpensesPesewas: operatingExpenses,
      inventoryWastePesewas: recordedProfit.inventoryWastePesewas,
      directCostPesewas: recordedProfit.directCostPesewas,
      grossProfitPesewas: recordedProfit.grossProfitPesewas,
      netProfitPesewas: recordedProfit.netProfitPesewas,
      grossMarginBasisPoints: recordedProfit.grossMarginBasisPoints,
      netMarginBasisPoints: recordedProfit.netMarginBasisPoints,
      isComplete: recordedProfit.isComplete,
      lowStockCount: inventorySummary[0]?.lowStockCount ?? 0,
      inventoryValuePesewas: inventorySummary[0]?.inventoryValuePesewas ?? 0,
    },
    expenseBreakdown,
    recentExpenses,
    paymentBreakdown,
    fulfillmentBreakdown,
    topItems,
    dailySales,
    recentOrders,
    activeStatuses,
  };
}

export async function listKitchenOrders() {
  const db = await requireDb();
  const orderRows = await db.select({
    id: orders.id, orderNumber: orders.orderNumber, status: orders.status, orderType: orders.orderType, totalPesewas: orders.totalPesewas,
    customerName: users.name, customerNote: orders.customerNote, deliveryPhone: orders.deliveryPhone, deliveryAddress: orders.deliveryAddress,
    deliveryInstructions: orders.deliveryInstructions, createdAt: orders.createdAt, paymentMethod: payments.method, paymentStatus: payments.status,
  }).from(orders).innerJoin(users, eq(orders.userId, users.id)).leftJoin(payments, eq(payments.orderId, orders.id))
    .where(or(inArray(payments.method, ["cash_on_pickup", "cash_on_delivery"]), eq(payments.status, "successful")))
    .orderBy(desc(orders.createdAt)).limit(80);
  if (!orderRows.length) return [];
  const items = await db.select({ orderId: orderItems.orderId, productName: orderItems.productName, quantity: orderItems.quantity })
    .from(orderItems).where(inArray(orderItems.orderId, orderRows.map((order) => order.id)));
  return orderRows.map((order) => ({ ...order, paymentMethod: order.paymentMethod ?? "cash_on_pickup", paymentStatus: order.paymentStatus ?? "pending", items: items.filter((item) => item.orderId === order.id) }));
}

export async function updateKitchenOrderStatus(orderId: number, nextStatus: OrderStatus, changedByUserId: number) {
  const db = await requireDb();
  const order = (await db.select({ id: orders.id, status: orders.status, orderType: orders.orderType }).from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!order) throw new Error("Order not found");
  if (!isValidKitchenTransition(order.status, nextStatus, order.orderType)) throw new Error(`Cannot move an ${order.status} order to ${nextStatus}`);
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: nextStatus, updatedAt: new Date() }).where(eq(orders.id, orderId));
    await tx.insert(orderStatusHistory).values({ orderId, previousStatus: order.status, nextStatus, changedByUserId });
    if (nextStatus === "preparing") {
      const usage = await tx.select({
        orderItemId: orderIngredientUsage.orderItemId, inventoryItemId: orderIngredientUsage.inventoryItemId,
        quantityMilliunits: orderIngredientUsage.quantityMilliunits, unitCostPesewas: orderIngredientUsage.unitCostPesewas,
      }).from(orderIngredientUsage).innerJoin(orderItems, eq(orderIngredientUsage.orderItemId, orderItems.id))
        .where(eq(orderItems.orderId, orderId));
      for (const item of usage) {
        const [movement] = await tx.insert(inventoryAdjustments).values({
          inventoryItemId: item.inventoryItemId, orderItemId: item.orderItemId, reason: "order_usage",
          quantityDeltaMilliunits: -item.quantityMilliunits, unitCostPesewas: item.unitCostPesewas,
          note: "Recorded when kitchen preparation started", createdByUserId: changedByUserId,
        }).onConflictDoNothing().returning({ id: inventoryAdjustments.id });
        if (movement) await tx.update(inventoryItems).set({
          currentQuantityMilliunits: sql`${inventoryItems.currentQuantityMilliunits} - ${item.quantityMilliunits}`,
          updatedAt: new Date(),
        }).where(eq(inventoryItems.id, item.inventoryItemId));
      }
    }
  });
  return { id: orderId, status: nextStatus };
}
