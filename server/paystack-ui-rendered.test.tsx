// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkout: vi.fn(),
  setLocation: vi.fn(),
  invalidateCart: vi.fn(),
  invalidateOrders: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({
    lines: [{ id: "matcha-cloud-boba", name: "Matcha Cloud Boba", imageUrl: "https://example.com/boba.jpg", pricePesewas: 7500, quantity: 1 }],
    subtotalPesewas: 7500, updateQuantity: vi.fn(), removeItem: vi.fn(), isLoading: false,
  }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ storefront: { cart: { invalidate: mocks.invalidateCart }, orders: { invalidate: mocks.invalidateOrders } } }),
    storefront: {
      profile: { useQuery: () => ({ data: { phone: "024 000 0000", defaultAddress: "Osu, Accra" } }) },
      checkout: { useMutation: () => ({ mutate: mocks.checkout, isPending: false }) },
      verifyPaystackPayment: { useMutation: () => ({ mutate: mocks.verify, isPending: false, data: undefined, error: null }) },
    },
  },
}));
vi.mock("wouter", () => ({ useLocation: () => ["/cart", mocks.setLocation], useSearch: () => "" , Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Cart from "../client/src/pages/Cart";
import PaymentReturn from "../client/src/pages/PaymentReturn";

describe("rendered Paystack customer flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("labels online options as Paystack test checkout and changes the checkout action", async () => {
    const user = userEvent.setup();
    render(<Cart />);

    await user.selectOptions(screen.getByRole("combobox"), "card");

    expect(screen.getByText("You will be redirected to Paystack’s secure test checkout. No real payment will be collected.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue to Paystack test checkout" })).toBeTruthy();
  });

  it("shows a safe return state when Paystack does not provide a reference", () => {
    render(<PaymentReturn />);
    expect(screen.getByText("Payment reference missing")).toBeTruthy();
    expect(mocks.verify).not.toHaveBeenCalled();
  });
});
