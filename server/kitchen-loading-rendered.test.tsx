// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 7, name: "Kitchen Staff", role: "kitchen" }, loading: false }) }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ kitchen: { orders: { cancel: vi.fn(), getData: vi.fn(), setData: vi.fn(), invalidate: vi.fn() }, menu: { invalidate: vi.fn() }, }, catalog: { list: { invalidate: vi.fn() } } }),
    kitchen: {
      orders: { useQuery: () => ({ data: undefined, isLoading: true, isError: false, isFetching: true, refetch: vi.fn() }) },
      menu: { useQuery: () => ({ data: undefined, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() }) },
      updateStatus: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      createProduct: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      updateProduct: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      setProductActive: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));

import KitchenDashboard from "../client/src/pages/KitchenDashboard";

describe("Kitchen Board initial loading", () => {
  it("shows an explicit queue-loading state instead of false-zero live metrics", () => {
    render(<KitchenDashboard />);
    expect(screen.getByText("Loading live kitchen queue…")).toBeTruthy();
    expect(screen.queryByText("No active orders. The kitchen is caught up.")).toBeNull();
    expect(screen.queryByText("Active")).toBeNull();
  });
});
