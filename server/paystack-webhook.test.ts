import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createPaystackWebhookHandler } from "./paystack-webhook";

const secret = "sk_test_webhook_unit_test";
const reference = "SANDS-42-abcdefghijklmnopqrstuvwxyz";
const payload = Buffer.from(JSON.stringify({ event: "charge.success", data: { reference } }));
const signature = createHmac("sha512", secret).update(payload).digest("hex");

function createHandler() {
  const getPayment = vi.fn().mockResolvedValue({ paymentId: 9, orderId: 42, orderNumber: "CB-TEST-42", amountPesewas: 12500, status: "pending", method: "card", reference });
  const verifyPayment = vi.fn().mockResolvedValue({ reference, status: "success", amount: 12500, currency: "GHS" });
  const recordPayment = vi.fn().mockResolvedValue({ newlySuccessful: true });
  const getNotification = vi.fn().mockResolvedValue(undefined);
  const notify = vi.fn();
  return {
    handler: createPaystackWebhookHandler({ getPayment, verifyPayment, recordPayment, getNotification, notify, secret: () => secret }),
    getPayment, verifyPayment, recordPayment, getNotification, notify,
  };
}

describe("Paystack webhook handler", () => {
  it("rejects unsigned and malformed webhook bodies before payment access", async () => {
    const { handler, getPayment } = createHandler();
    await expect(handler(payload, undefined)).resolves.toEqual({ status: 401, outcome: "rejected" });
    const malformed = Buffer.from("{");
    const malformedSignature = createHmac("sha512", secret).update(malformed).digest("hex");
    await expect(handler(malformed, malformedSignature)).resolves.toEqual({ status: 400, outcome: "rejected" });
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("records a verified charge success and notifies Kitchen only for the first reconciliation", async () => {
    const { handler, recordPayment, verifyPayment } = createHandler();
    await expect(handler(payload, signature)).resolves.toEqual({ status: 200, outcome: "accepted" });
    expect(verifyPayment).toHaveBeenCalledWith(reference);
    expect(recordPayment).toHaveBeenCalledWith(9, reference);
  });

  it("ignores unsupported events and mismatched verified amounts without updating payment state", async () => {
    const { handler, recordPayment, verifyPayment } = createHandler();
    const ignored = Buffer.from(JSON.stringify({ event: "refund.processed", data: { reference } }));
    const ignoredSignature = createHmac("sha512", secret).update(ignored).digest("hex");
    await expect(handler(ignored, ignoredSignature)).resolves.toEqual({ status: 200, outcome: "ignored" });
    expect(verifyPayment).not.toHaveBeenCalled();

    verifyPayment.mockResolvedValueOnce({ reference, status: "success", amount: 1, currency: "GHS" });
    await expect(handler(payload, signature)).resolves.toEqual({ status: 200, outcome: "ignored" });
    expect(recordPayment).not.toHaveBeenCalled();
  });

  it("acknowledges a duplicate successful event without repeating staff notification", async () => {
    const { handler, recordPayment, getNotification, notify } = createHandler();
    recordPayment.mockResolvedValueOnce({ newlySuccessful: false });
    await expect(handler(payload, signature)).resolves.toEqual({ status: 200, outcome: "accepted" });
    expect(getNotification).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });
});
