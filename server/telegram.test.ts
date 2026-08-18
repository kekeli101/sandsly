import { afterEach, describe, expect, it, vi } from "vitest";
import { formatTelegramOrderMessage, notifyTelegramNewOrder } from "./telegram";

const order = {
  orderNumber: "CB-TEST-123",
  status: "pending",
  customerName: "Test Customer",
  items: [{ name: "Matcha Cloud Boba", quantity: 2, unitPricePesewas: 7500, lineTotalPesewas: 15000 }],
  subtotalPesewas: 15000,
  deliveryFeePesewas: 2000,
  totalPesewas: 17000,
  customerNote: "Leave at the front desk",
  orderType: "delivery" as const,
  paymentMethod: "mobile_money",
  paymentStatus: "pending",
  deliveryPhone: "024 000 0000",
  deliveryAddress: "42 Test Street, Accra",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Telegram order notifications", () => {
  it("formats an order with GHS totals and item details", () => {
    const message = formatTelegramOrderMessage(order);
    expect(message).toContain("CB-TEST-123");
    expect(message).toContain("Matcha Cloud Boba ×2 — GH₵ 150.00");
    expect(message).toContain("Total: GH₵ 170.00");
    expect(message).toContain("Leave at the front desk");
    expect(message).toContain("Type: Delivery");
    expect(message).toContain("Payment: mobile money (pending)");
    expect(message).toContain("42 Test Street, Accra");
  });

  it("posts the formatted order to the configured Telegram group", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "-100123");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(notifyTelegramNewOrder(order)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.telegram.org/bottest-token/sendMessage",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ chat_id: "-100123", text: formatTelegramOrderMessage(order) }),
      }),
    );
  });

  it("skips delivery when Telegram credentials are absent", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(notifyTelegramNewOrder(order)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
