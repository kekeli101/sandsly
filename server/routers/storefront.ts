import { z } from "zod";
import { addCartItem, attachPaystackReference, clearCartForUser, createOrderFromCart, getCartForUser, getCustomerProfile, getOrderForTelegramNotification, getPaystackPaymentForUser, getPendingOnlinePaymentForUser, listOrdersForUser, markPaystackPaymentFailed, recordVerifiedPaystackPaymentOnce, saveCustomerAccountDetails, setCartItemQuantity } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { notifyTelegramNewOrder } from "../telegram";
import { orderTypeValues, paymentMethodValues } from "../../drizzle/schema";
import { initializePaystackTestPayment, verifyPaystackTestPayment } from "../paystack";

const cartItemInput = z.object({ productId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(20) });

export const storefrontRouter = router({
  cart: protectedProcedure.query(({ ctx }) => getCartForUser(ctx.user.id)),
  addToCart: protectedProcedure.input(cartItemInput).mutation(({ ctx, input }) => addCartItem(ctx.user.id, input.productId, input.quantity)),
  setCartItemQuantity: protectedProcedure.input(z.object({ productId: z.string().min(1).max(64), quantity: z.number().int().min(0).max(20) }))
    .mutation(({ ctx, input }) => setCartItemQuantity(ctx.user.id, input.productId, input.quantity)),
  clearCart: protectedProcedure.mutation(({ ctx }) => clearCartForUser(ctx.user.id)),
  checkout: protectedProcedure.input(z.object({
    customerNote: z.string().trim().max(280).optional(),
    orderType: z.enum(orderTypeValues).default("pickup"),
    paymentMethod: z.enum(paymentMethodValues).default("cash_on_pickup"),
    deliveryPhone: z.string().trim().min(6).max(32).optional(),
    deliveryAddress: z.string().trim().min(4).max(500).optional(),
    deliveryInstructions: z.string().trim().max(280).optional(),
  }))
    .mutation(async ({ ctx, input }) => {
      const order = await createOrderFromCart(ctx.user.id, input);
      const onlineMethod = input.paymentMethod === "mobile_money" || input.paymentMethod === "card" ? input.paymentMethod : null;
      if (!onlineMethod) {
        try {
          await notifyTelegramNewOrder({ ...order, customerName: ctx.user.name ?? "Customer" });
        } catch (error) {
          console.warn("[Telegram] New-order notification failed; checkout remains successful", error);
        }
        return order;
      }
      if (!ctx.user.email) throw new Error("Add an email address to your account before paying online");
      try {
        const payment = await initializePaystackTestPayment({
          orderId: order.id, orderNumber: order.orderNumber, email: ctx.user.email,
          amountPesewas: order.totalPesewas, method: onlineMethod,
        });
        await attachPaystackReference(order.id, payment.reference);
        return { ...order, paymentReference: payment.reference, paymentAuthorizationUrl: payment.authorizationUrl };
      } catch (error) {
        console.warn("[Paystack] Checkout initialization failed; preserving the pending order for retry", error);
        return { ...order, onlinePaymentPending: true };
      }
    }),
  startPaystackPayment: protectedProcedure.input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await getPendingOnlinePaymentForUser(ctx.user.id, input.orderId);
      if (!payment || (payment.method !== "card" && payment.method !== "mobile_money")) throw new Error("This order is not awaiting an online payment");
      if (!ctx.user.email) throw new Error("Add an email address to your account before paying online");
      const initialized = await initializePaystackTestPayment({
        orderId: payment.orderId, orderNumber: payment.orderNumber, email: ctx.user.email,
        amountPesewas: payment.amountPesewas, method: payment.method,
      });
      await attachPaystackReference(payment.orderId, initialized.reference);
      return { orderNumber: payment.orderNumber, authorizationUrl: initialized.authorizationUrl };
    }),
  verifyPaystackPayment: protectedProcedure.input(z.object({ reference: z.string().trim().min(10).max(160).regex(/^[A-Za-z0-9_.=-]+$/) }))
    .mutation(async ({ ctx, input }) => {
      const payment = await getPaystackPaymentForUser(ctx.user.id, input.reference);
      if (!payment || (payment.method !== "card" && payment.method !== "mobile_money")) throw new Error("Payment reference was not found for this account");
      if (payment.status === "successful") return { orderNumber: payment.orderNumber, status: "successful" as const, alreadyVerified: true };
      const verified = await verifyPaystackTestPayment(input.reference);
      if (verified.reference !== input.reference || verified.currency !== "GHS" || verified.amount !== payment.amountPesewas) {
        throw new Error("The Paystack payment details do not match this order");
      }
      if (verified.status === "success") {
        const recorded = await recordVerifiedPaystackPaymentOnce(payment.paymentId, input.reference);
        if (recorded.newlySuccessful) {
          const notification = await getOrderForTelegramNotification(payment.orderId);
          if (notification) {
            try {
              await notifyTelegramNewOrder(notification);
            } catch (error) {
              console.warn("[Telegram] Paid-order notification failed; payment remains successful", error);
            }
          }
        }
        return { orderNumber: payment.orderNumber, status: "successful" as const, alreadyVerified: !recorded.newlySuccessful };
      }
      if (verified.status === "failed" || verified.status === "abandoned" || verified.status === "reversed") {
        await markPaystackPaymentFailed(payment.paymentId, input.reference);
        return { orderNumber: payment.orderNumber, status: "failed" as const, alreadyVerified: false };
      }
      return { orderNumber: payment.orderNumber, status: "pending" as const, alreadyVerified: false };
    }),
  orders: protectedProcedure.query(({ ctx }) => listOrdersForUser(ctx.user.id)),
  profile: protectedProcedure.query(({ ctx }) => getCustomerProfile(ctx.user.id)),
  saveProfile: protectedProcedure.input(z.object({ displayName: z.string().trim().min(1).max(80), phone: z.string().trim().max(32).optional(), defaultAddress: z.string().trim().max(500).optional() }))
    .mutation(({ ctx, input }) => saveCustomerAccountDetails(ctx.user.id, input)),
});
