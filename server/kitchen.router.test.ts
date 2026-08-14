import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ listKitchenOrders: vi.fn(), updateKitchenOrderStatus: vi.fn() }));
vi.mock("./db", () => ({
  listKitchenOrders: mocks.listKitchenOrders,
  updateKitchenOrderStatus: mocks.updateKitchenOrderStatus,
  listCatalog: vi.fn(), listRecentOrdersForAdmin: vi.fn(), getCartForUser: vi.fn(), addCartItem: vi.fn(),
  setCartItemQuantity: vi.fn(), clearCartForUser: vi.fn(), createOrderFromCart: vi.fn(), getCustomerProfile: vi.fn(), saveCustomerProfile: vi.fn(),
}));

import { appRouter } from "./routers";

function contextFor(role: "user" | "kitchen" | "admin"): TrpcContext {
  return {
    user: { id: 5, openId: `test-${role}`, name: "Test Staff", email: "test@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("kitchen router", () => {
  it("rejects customer accounts and permits kitchen staff to update an order", async () => {
    mocks.listKitchenOrders.mockResolvedValue([]);
    mocks.updateKitchenOrderStatus.mockResolvedValue({ id: 8, status: "accepted" });
    await expect(appRouter.createCaller(contextFor("user")).kitchen.orders()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(contextFor("kitchen")).kitchen.updateStatus({ orderId: 8, status: "accepted" })).resolves.toEqual({ id: 8, status: "accepted" });
    expect(mocks.updateKitchenOrderStatus).toHaveBeenCalledWith(8, "accepted");
  });
});
