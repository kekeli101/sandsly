import { createHmac, timingSafeEqual } from "node:crypto";
import {
  getOrderForTelegramNotification,
  getPaystackPaymentForWebhook,
  recordVerifiedPaystackPaymentOnce,
} from "./db";
import { verifyPaystackTestPayment } from "./paystack";
import { notifyTelegramNewOrder } from "./telegram";

type WebhookPayment = {
  paymentId: number;
  orderId: number;
  orderNumber: string;
  amountPesewas: number;
  status: string;
  method: string;
  reference: string | null;
};

type WebhookDeps = {
  getPayment: (reference: string) => Promise<WebhookPayment | undefined>;
  verifyPayment: (reference: string) => Promise<{ reference: string; status: string; amount: number; currency: string }>;
  recordPayment: (paymentId: number, reference: string) => Promise<{ newlySuccessful: boolean }>;
  getNotification: typeof getOrderForTelegramNotification;
  notify: typeof notifyTelegramNewOrder;
  secret: () => string;
};

export type PaystackWebhookResult = { status: number; outcome: "accepted" | "ignored" | "rejected" | "retry" };

function paystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret?.startsWith("sk_test_")) throw new Error("Paystack test checkout is not configured");
  return secret;
}

const defaultDeps: WebhookDeps = {
  getPayment: getPaystackPaymentForWebhook,
  verifyPayment: verifyPaystackTestPayment,
  recordPayment: recordVerifiedPaystackPaymentOnce,
  getNotification: getOrderForTelegramNotification,
  notify: notifyTelegramNewOrder,
  secret: paystackSecret,
};

export function isValidPaystackSignature(rawBody: Buffer, signature: string | undefined, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const received = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
}

export function createPaystackWebhookHandler(overrides: Partial<WebhookDeps> = {}) {
  const deps = { ...defaultDeps, ...overrides };

  return async (rawBody: Buffer, signature: string | undefined): Promise<PaystackWebhookResult> => {
    let secret: string;
    try {
      secret = deps.secret();
    } catch (error) {
      console.error("[Paystack webhook] Payment configuration unavailable", error);
      return { status: 503, outcome: "retry" };
    }

    if (!isValidPaystackSignature(rawBody, signature, secret)) {
      return { status: 401, outcome: "rejected" };
    }

    let event: { event?: unknown; data?: { reference?: unknown } };
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return { status: 400, outcome: "rejected" };
    }

    if (event.event !== "charge.success") return { status: 200, outcome: "ignored" };
    const reference = typeof event.data?.reference === "string" ? event.data.reference : undefined;
    if (!reference || reference.length > 160 || !/^[A-Za-z0-9_.=-]+$/.test(reference)) {
      return { status: 400, outcome: "rejected" };
    }

    try {
      const payment = await deps.getPayment(reference);
      if (!payment || (payment.method !== "card" && payment.method !== "mobile_money") || payment.reference !== reference) {
        return { status: 200, outcome: "ignored" };
      }

      const verified = await deps.verifyPayment(reference);
      if (verified.reference !== reference || verified.status !== "success" || verified.currency !== "GHS" || verified.amount !== payment.amountPesewas) {
        return { status: 200, outcome: "ignored" };
      }

      const recorded = await deps.recordPayment(payment.paymentId, reference);
      if (recorded.newlySuccessful) {
        const notification = await deps.getNotification(payment.orderId);
        if (notification) {
          try {
            await deps.notify(notification);
          } catch (error) {
            console.error("[Paystack webhook] Payment recorded but Telegram notification failed", error);
          }
        }
      }
      return { status: 200, outcome: "accepted" };
    } catch (error) {
      console.error("[Paystack webhook] Processing failed", error);
      return { status: 500, outcome: "retry" };
    }
  };
}

export const handlePaystackWebhook = createPaystackWebhookHandler();
