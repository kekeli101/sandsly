import { z } from "zod";
import { expenseCategoryValues, inventoryUnitValues } from "../../drizzle/schema";
import {
  createExpense,
  createInventoryItem,
  getAdminDashboardData,
  getManagerConsoleData,
  listFinanceManagementData,
  listRecentOrdersForAdmin,
  recordInventoryAdjustment,
  replaceProductRecipe,
} from "../db";
import { adminProcedure, router } from "../_core/trpc";

const inventoryFields = z.object({
  name: z.string().trim().min(1).max(160),
  unit: z.enum(inventoryUnitValues),
  currentQuantityMilliunits: z.number().int().min(0).max(100_000_000),
  reorderPointMilliunits: z.number().int().min(0).max(100_000_000),
  unitCostPesewas: z.number().int().min(0).max(100_000_000),
});

export const adminRouter = router({
  recentOrders: adminProcedure.query(() => listRecentOrdersForAdmin()),
  dashboard: adminProcedure.query(() => getAdminDashboardData()),
  console: adminProcedure.query(() => getManagerConsoleData()),
  financeSetup: adminProcedure.query(() => listFinanceManagementData()),
  createInventoryItem: adminProcedure.input(inventoryFields)
    .mutation(({ ctx, input }) => createInventoryItem(input, ctx.user.id)),
  adjustInventory: adminProcedure.input(z.object({
    inventoryItemId: z.number().int().positive(),
    reason: z.enum(["opening_count", "purchase", "waste", "correction"]),
    quantityDeltaMilliunits: z.number().int().min(-100_000_000).max(100_000_000).refine(value => value !== 0, "Enter a non-zero quantity adjustment"),
    unitCostPesewas: z.number().int().min(0).max(100_000_000).optional(),
    note: z.string().trim().max(280).optional(),
  })).mutation(({ ctx, input }) => recordInventoryAdjustment(input, ctx.user.id)),
  replaceRecipe: adminProcedure.input(z.object({
    productId: z.string().trim().min(1).max(64),
    ingredients: z.array(z.object({ inventoryItemId: z.number().int().positive(), quantityMilliunits: z.number().int().positive().max(100_000_000) })).max(30),
  }).refine(input => new Set(input.ingredients.map(ingredient => ingredient.inventoryItemId)).size === input.ingredients.length, "Use each inventory item once per recipe"))
    .mutation(({ input }) => replaceProductRecipe(input.productId, input.ingredients)),
  createExpense: adminProcedure.input(z.object({
    category: z.enum(expenseCategoryValues),
    description: z.string().trim().min(1).max(240),
    amountPesewas: z.number().int().positive().max(100_000_000),
    occurredAt: z.date(),
  })).mutation(({ ctx, input }) => createExpense(input, ctx.user.id)),
});
