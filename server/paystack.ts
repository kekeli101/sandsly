const PAYSTACK_API_URL = "https://api.paystack.co";

export type PaystackVerification = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  channel?: string;
  gatewayResponse?: string;
};

function requiredTestSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret?.startsWith("sk_test_")) throw new Error("Paystack test checkout is not configured");
  return secret;
}

function publicAppOrigin() {
  const configuredOrigin = process.env.FRONTEND_ORIGIN?.split(",")[0]?.trim();
  const fallbackOrigin = process.env.NODE_ENV === "production" ? "https://sandsly.vercel.app" : "http://localhost:3000";
  return new URL(configuredOrigin || fallbackOrigin).origin;
}

export function paystackCallbackUrl() {
  return new URL("/payment/verify", publicAppOrigin()).toString();
}

export function createPaystackReference(orderId: number) {
  return `SANDS-${orderId}-${crypto.randomUUID().replaceAll("-", "")}`;
}

export async function initializePaystackTestPayment(input: { orderId: number; orderNumber: string; email: string; amountPesewas: number; method: "mobile_money" | "card" }) {
  const secret = requiredTestSecret();
  const reference = createPaystackReference(input.orderId);
  const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      amount: String(input.amountPesewas),
      currency: "GHS",
      reference,
      callback_url: paystackCallbackUrl(),
      channels: input.method === "mobile_money" ? ["mobile_money"] : ["card"],
      metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await response.json() as { status?: boolean; message?: string; data?: { authorization_url?: string; reference?: string } };
  if (!response.ok || !payload.status || !payload.data?.authorization_url || payload.data.reference !== reference) {
    throw new Error(payload.message || `Paystack could not initialize this payment (${response.status})`);
  }
  return { reference, authorizationUrl: payload.data.authorization_url };
}

export async function verifyPaystackTestPayment(reference: string): Promise<PaystackVerification> {
  const secret = requiredTestSecret();
  const response = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await response.json() as { status?: boolean; message?: string; data?: { reference?: string; status?: string; amount?: number; currency?: string; channel?: string; gateway_response?: string } };
  if (!response.ok || !payload.status || !payload.data?.reference || !payload.data.status || payload.data.amount === undefined || !payload.data.currency) {
    throw new Error(payload.message || `Paystack could not verify this payment (${response.status})`);
  }
  return {
    reference: payload.data.reference,
    status: payload.data.status,
    amount: payload.data.amount,
    currency: payload.data.currency,
    channel: payload.data.channel,
    gatewayResponse: payload.data.gateway_response,
  };
}
