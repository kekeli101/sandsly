// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  saveProfile: vi.fn(),
  startPaystackPayment: vi.fn(),
  invalidateAuth: vi.fn(),
  invalidateProfile: vi.fn(),
  setLocation: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  user: { id: 42, name: "Ama Customer", email: "ama@example.com", role: "user" as "user" | "admin" },
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    logout: vi.fn().mockResolvedValue(undefined),
    user: mocks.user,
  }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: mocks.invalidateAuth } }, storefront: { profile: { invalidate: mocks.invalidateProfile } } }),
    auth: {
      login: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      register: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      requestPasswordReset: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    storefront: {
      profile: { useQuery: () => ({ data: { phone: "024 000 0000", defaultAddress: "Osu, Accra" } }) },
      orders: { useQuery: () => ({
        data: [{
          id: 7, orderNumber: "CB-12345678-321", status: "preparing", orderType: "delivery", totalPesewas: 9500,
          paymentMethod: "card", paymentStatus: "pending", createdAt: new Date("2026-08-21T10:00:00Z"), deliveryAddress: "Osu, Accra",
          items: [{ productName: "Matcha Cloud Boba", quantity: 2, lineTotalPesewas: 7500 }], history: [{ nextStatus: "pending" }, { nextStatus: "accepted" }, { nextStatus: "preparing" }],
        }], isLoading: false,
      }) },
      saveProfile: { useMutation: () => ({ mutate: mocks.saveProfile, isPending: false }) },
      startPaystackPayment: { useMutation: () => ({ mutate: mocks.startPaystackPayment, isPending: false }) },
    },
  },
}));
vi.mock("@/lib/kitchen-access", () => ({ getKitchenProfileAccess: (role?: string) => ({ canUseKitchen: role === "admin", description: "Staff operations are available." }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/profile", mocks.setLocation] }));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));

import Account from "../client/src/pages/Account";

describe("rendered customer profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 42, name: "Ama Customer", email: "ama@example.com", role: "user" };
  });

  it("renders editable account details and a readable order-history record", async () => {
    const user = userEvent.setup();
    render(<Account />);

    const name = await screen.findByLabelText("Name");
    expect((name as HTMLInputElement).value).toBe("Ama Customer");
    expect(screen.getByLabelText("Account email").getAttribute("readonly")).not.toBeNull();
    expect(screen.getByDisplayValue("024 000 0000")).toBeTruthy();
    expect(screen.getByText("CB-12345678-321")).toBeTruthy();
    expect(screen.getByText("Matcha Cloud Boba ×2")).toBeTruthy();
    expect(screen.getByText("delivery")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Complete Paystack test payment" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Manager Console" })).toBeNull();

    await user.clear(name);
    await user.type(name, "Ama Mensah");
    await user.click(screen.getByRole("button", { name: "Save account details" }));

    expect(mocks.saveProfile).toHaveBeenCalledWith({ displayName: "Ama Mensah", phone: "024 000 0000", defaultAddress: "Osu, Accra" });
  });

  it("shows the Manager Console entry only to an administrator and navigates there", async () => {
    const user = userEvent.setup();
    mocks.user = { id: 9, name: "Restaurant Manager", email: "manager@example.com", role: "admin" };
    render(<Account />);

    await user.click(screen.getByRole("button", { name: "Manager Console" }));
    expect(mocks.setLocation).toHaveBeenCalledWith("/admin");
  });
});
