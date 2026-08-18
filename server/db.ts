import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  cartItems,
  carts,
  categories,
  customerProfiles,
  type InsertUser,
  orderItems,
  orders,
  products,
  type OrderStatus,
  users,
} from "../drizzle/schema";
import { calculateOrderTotals } from "./storefront-utils";
import { isValidKitchenTransition } from "./kitchen-utils";
import { filterCustomerCatalogProducts } from "./catalog-utils";

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

export async function createOrderFromCart(userId: number, customerNote?: string) {
  const db = await requireDb();
  const cart = await getOrCreateCart(userId);
  return db.transaction(async (tx) => {
    const lines = await tx.select({
      id: products.id, name: products.name, pricePesewas: products.pricePesewas, quantity: cartItems.quantity,
    }).from(cartItems).innerJoin(products, eq(cartItems.productId, products.id)).where(eq(cartItems.cartId, cart.id));
    if (!lines.length) throw new Error("Your bag is empty");
    const totals = calculateOrderTotals(lines.map((line) => ({ unitPricePesewas: line.pricePesewas, quantity: line.quantity })), DELIVERY_FEE_PESEWAS);
    const orderNumber = `CB-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;
    const [created] = await tx.insert(orders).values({
      orderNumber, userId, status: "pending", currency: "GHS", ...totals, customerNote: customerNote || null,
    }).returning({ id: orders.id });
    await tx.insert(orderItems).values(lines.map((line) => ({
      orderId: created.id, productId: line.id, productName: line.name, unitPricePesewas: line.pricePesewas,
      quantity: line.quantity, lineTotalPesewas: line.pricePesewas * line.quantity,
    })));
    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    return {
      orderNumber,
      status: "pending" as const,
      ...totals,
      items: lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        unitPricePesewas: line.pricePesewas,
        lineTotalPesewas: line.pricePesewas * line.quantity,
      })),
      customerNote: customerNote || undefined,
    };
  });
}

export async function listOrdersForUser(userId: number) {
  const db = await requireDb();
  return db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, totalPesewas: orders.totalPesewas, createdAt: orders.createdAt })
    .from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
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

export async function listRecentOrdersForAdmin() {
  const db = await requireDb();
  return db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, totalPesewas: orders.totalPesewas, createdAt: orders.createdAt, customerName: users.name })
    .from(orders).innerJoin(users, eq(orders.userId, users.id)).orderBy(desc(orders.createdAt)).limit(50);
}

export async function listKitchenOrders() {
  const db = await requireDb();
  const orderRows = await db.select({
    id: orders.id, orderNumber: orders.orderNumber, status: orders.status, totalPesewas: orders.totalPesewas,
    customerName: users.name, customerNote: orders.customerNote, createdAt: orders.createdAt,
  }).from(orders).innerJoin(users, eq(orders.userId, users.id)).orderBy(desc(orders.createdAt)).limit(80);
  if (!orderRows.length) return [];
  const items = await db.select({ orderId: orderItems.orderId, productName: orderItems.productName, quantity: orderItems.quantity })
    .from(orderItems).where(inArray(orderItems.orderId, orderRows.map((order) => order.id)));
  return orderRows.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) }));
}

export async function updateKitchenOrderStatus(orderId: number, nextStatus: OrderStatus) {
  const db = await requireDb();
  const order = (await db.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!order) throw new Error("Order not found");
  if (!isValidKitchenTransition(order.status, nextStatus)) throw new Error(`Cannot move an ${order.status} order to ${nextStatus}`);
  await db.update(orders).set({ status: nextStatus, updatedAt: new Date() }).where(eq(orders.id, orderId));
  return { id: orderId, status: nextStatus };
}
