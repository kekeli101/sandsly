// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const snapshot = {
  summary: { totalOrders: 18, todayOrders: 4, activeOrders: 3, fulfilledOrders: 13, cancelledOrders: 2, fulfilledSalesPesewas: 126500, todayFulfilledSalesPesewas: 30500, customerCount: 9, activeProducts: 12, inactiveProducts: 1 },
  finance: { onlineCollectedPesewas: 57000, pendingOnlinePesewas: 9500, pendingOnlineCount: 1, failedOrRefundedOnlinePesewas: 4200, failedOrRefundedOnlineCount: 1, cashFulfilledToReconcilePesewas: 69500, cashFulfilledToReconcileCount: 10 },
  paymentBreakdown: [{ method: "card", status: "successful", orderCount: 4, amountPesewas: 57000 }],
  fulfillmentBreakdown: [],
  topItems: [{ name: "Matcha Cloud Boba", quantity: 12, revenuePesewas: 45000, orderCount: 8 }],
  dailySales: [{ day: "Aug 22", orderCount: 3, revenuePesewas: 30500 }],
  recentOrders: [{ id: 1, orderNumber: "CB-12345678-321", status: "preparing", orderType: "delivery", totalPesewas: 9500, customerName: "Ama Customer", paymentMethod: "card", paymentStatus: "pending" }],
  activeStatuses: ["pending", "accepted", "preparing", "ready", "out_for_delivery"],
};

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Restaurant Manager", role: "admin" }, loading: false }) }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { admin: { console: { useQuery: () => ({ data: snapshot, isLoading: false, isError: false, dataUpdatedAt: new Date("2026-08-22T12:00:00Z").getTime() }) } } } }));

import AdminDashboard from "../client/src/pages/AdminDashboard";

describe("rendered owner/manager Admin Console", () => {
  it("separates food, operations, and payment collection metrics without presenting sales as profit", () => {
    render(<AdminDashboard />);

    expect(screen.getByRole("heading", { name: /manager\s*console/i })).toBeTruthy();
    expect(screen.getByText("Fulfilled sales")).toBeTruthy();
    expect(screen.getByText("Online received")).toBeTruthy();
    expect(screen.getByText("Cash to reconcile")).toBeTruthy();
    expect(screen.getByText("Top selling dishes")).toBeTruthy();
    expect(screen.getByText("Matcha Cloud Boba")).toBeTruthy();
    expect(screen.getByText("Payment method & status")).toBeTruthy();
    expect(screen.getByText(/does not yet store profit/i)).toBeTruthy();
  });
});
