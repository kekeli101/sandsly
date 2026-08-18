import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { orderStatusValues } from "../../drizzle/schema";
import { createMenuProduct, listKitchenOrders, listMenuManagementData, setMenuProductActive, updateKitchenOrderStatus, updateMenuProduct } from "../db";
import { MenuImageStorageError, uploadMenuImage } from "../menu-image-storage";
import { kitchenProcedure, router } from "../_core/trpc";

const productFields = z.object({
  categoryId: z.number().int().positive(), name: z.string().trim().min(1).max(160), description: z.string().trim().min(1).max(2000),
  pricePesewas: z.number().int().min(0).max(10_000_000), imageUrl: z.string().url().max(2048), badge: z.string().trim().max(48).nullable().optional(),
  crunchLevel: z.number().int().min(0).max(5), sortOrder: z.number().int().min(0).max(10_000),
});

export const kitchenRouter = router({
  orders: kitchenProcedure.query(() => listKitchenOrders()),
  updateStatus: kitchenProcedure.input(z.object({ orderId: z.number().int().positive(), status: z.enum(orderStatusValues) }))
    .mutation(({ ctx, input }) => updateKitchenOrderStatus(input.orderId, input.status, ctx.user.id)),
  menu: kitchenProcedure.query(() => listMenuManagementData()),
  uploadImage: kitchenProcedure.input(z.object({
    contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    base64: z.string().min(4).max(7_000_000),
  })).mutation(async ({ ctx, input }) => {
    try {
      return await uploadMenuImage({ ...input, userId: ctx.user.id });
    } catch (error) {
      if (error instanceof MenuImageStorageError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      throw error;
    }
  }),
  createProduct: kitchenProcedure.input(productFields.extend({ id: z.string().trim().min(1).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) }))
    .mutation(({ input }) => createMenuProduct(input)),
  updateProduct: kitchenProcedure.input(productFields.partial().extend({ productId: z.string().trim().min(1).max(64) }))
    .mutation(({ input }) => {
      const { productId, ...changes } = input;
      return updateMenuProduct(productId, changes);
    }),
  setProductActive: kitchenProcedure.input(z.object({ productId: z.string().trim().min(1).max(64), isActive: z.boolean() }))
    .mutation(({ input }) => setMenuProductActive(input.productId, input.isActive)),
});
