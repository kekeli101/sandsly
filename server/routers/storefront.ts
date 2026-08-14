import { z } from "zod";
import { addCartItem, clearCartForUser, createOrderFromCart, getCartForUser, getCustomerProfile, listOrdersForUser, saveCustomerProfile, setCartItemQuantity } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const cartItemInput = z.object({ productId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(20) });

export const storefrontRouter = router({
  cart: protectedProcedure.query(({ ctx }) => getCartForUser(ctx.user.id)),
  addToCart: protectedProcedure.input(cartItemInput).mutation(({ ctx, input }) => addCartItem(ctx.user.id, input.productId, input.quantity)),
  setCartItemQuantity: protectedProcedure.input(z.object({ productId: z.string().min(1).max(64), quantity: z.number().int().min(0).max(20) }))
    .mutation(({ ctx, input }) => setCartItemQuantity(ctx.user.id, input.productId, input.quantity)),
  clearCart: protectedProcedure.mutation(({ ctx }) => clearCartForUser(ctx.user.id)),
  checkout: protectedProcedure.input(z.object({ customerNote: z.string().trim().max(280).optional() }))
    .mutation(({ ctx, input }) => createOrderFromCart(ctx.user.id, input.customerNote)),
  orders: protectedProcedure.query(({ ctx }) => listOrdersForUser(ctx.user.id)),
  profile: protectedProcedure.query(({ ctx }) => getCustomerProfile(ctx.user.id)),
  saveProfile: protectedProcedure.input(z.object({ phone: z.string().trim().max(32).optional(), defaultAddress: z.string().trim().max(500).optional() }))
    .mutation(({ ctx, input }) => saveCustomerProfile(ctx.user.id, input.phone, input.defaultAddress)),
});
