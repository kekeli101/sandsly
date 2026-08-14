import { z } from "zod";
import { orderStatusValues } from "../../drizzle/schema";
import { listKitchenOrders, updateKitchenOrderStatus } from "../db";
import { kitchenProcedure, router } from "../_core/trpc";

export const kitchenRouter = router({
  orders: kitchenProcedure.query(() => listKitchenOrders()),
  updateStatus: kitchenProcedure.input(z.object({ orderId: z.number().int().positive(), status: z.enum(orderStatusValues) }))
    .mutation(({ input }) => updateKitchenOrderStatus(input.orderId, input.status)),
});
