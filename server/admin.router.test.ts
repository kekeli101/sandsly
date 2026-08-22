import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getAdminDashboardData: vi.fn(),
  getManagerConsoleData: vi.fn(),
  listRecentOrdersForAdmin: vi.fn(),
}));

vi.mock("./db", () => mocks);

import { adminRouter } from "./routers/admin";

function contextFor(role: "user" | "kitchen" | "admin"): TrpcContext {
  return {
    user: {
      id: 91,
      openId: `admin-console-${role}`,
      name: "Restaurant Manager",
      email: "manager@example.com",
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("owner/manager Admin Console", () => {
  it("keeps manager analytics exclusive to administrators", async () => {
    await expect(adminRouter.createCaller(contextFor("user")).console()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminRouter.createCaller(contextFor("kitchen")).console()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns the server-calculated operations and finance snapshot to an administrator", async () => {
    const snapshot = {
      summary: { totalOrders: 18, todayOrders: 4, activeOrders: 3, fulfilledOrders: 13, cancelledOrders: 2, fulfilledSalesPesewas: 126500, todayFulfilledSalesPesewas: 30500, customerCount: 9, activeProducts: 12, inactiveProducts: 1 },
      finance: { onlineCollectedPesewas: 57000, pendingOnlinePesewas: 9500, pendingOnlineCount: 1, failedOrRefundedOnlinePesewas: 4200, failedOrRefundedOnlineCount: 1, cashFulfilledToReconcilePesewas: 69500, cashFulfilledToReconcileCount: 10 },
      paymentBreakdown: [], fulfillmentBreakdown: [], topItems: [], dailySales: [], recentOrders: [], activeStatuses: ["pending"],
    };
    mocks.getManagerConsoleData.mockResolvedValue(snapshot);

    await expect(adminRouter.createCaller(contextFor("admin")).console()).resolves.toEqual(snapshot);
    expect(mocks.getManagerConsoleData).toHaveBeenCalledTimes(1);
  });
});
