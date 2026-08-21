// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  setLocation: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, logout: vi.fn() }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn() } }, storefront: { profile: { invalidate: vi.fn() } } }),
    auth: {
      login: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      register: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      requestPasswordReset: { useMutation: (options: { onSuccess?: () => void }) => ({ mutate: (input: unknown) => { mocks.requestPasswordReset(input); options.onSuccess?.(); }, isPending: false }) },
      resetPassword: { useMutation: () => ({ mutate: mocks.resetPassword, isPending: false }) },
    },
    storefront: {
      profile: { useQuery: () => ({ data: null }) },
      orders: { useQuery: () => ({ data: [], isLoading: false }) },
      saveProfile: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      startPaystackPayment: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));
vi.mock("@/lib/kitchen-access", () => ({ getKitchenProfileAccess: () => ({ canUseKitchen: false, description: "" }) }));
vi.mock("wouter", () => ({
  useLocation: () => ["/profile", mocks.setLocation],
  useSearch: () => "token=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0123456789",
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError, success: mocks.toastSuccess } }));

import Account from "../client/src/pages/Account";
import { PasswordVisibilityInput } from "../client/src/components/PasswordVisibilityInput";
import ResetPassword from "../client/src/pages/ResetPassword";

describe("rendered account password interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles password visibility without submitting its containing form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(event => event.preventDefault());
    function Harness() {
      const value = "correct-horse";
      return <form onSubmit={onSubmit}><PasswordVisibilityInput value={value} onChange={vi.fn()} autoComplete="current-password" /><button type="submit">Submit</button></form>;
    }

    render(<Harness />);
    const password = document.querySelector("input")!;
    expect(password.getAttribute("type")).toBe("password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password.getAttribute("type")).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe("true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a generic recovery confirmation after the forgot-password request", async () => {
    const user = userEvent.setup();
    render(<Account />);

    await user.click(screen.getByRole("button", { name: "Forgot your password?" }));
    await user.type(screen.getByRole("textbox", { name: "Email" }), "missing@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset instructions" }));

    expect(mocks.requestPasswordReset).toHaveBeenCalledWith({ email: "missing@example.com" });
    expect(screen.getByRole("status").textContent).toContain("If an eligible Sandsly account matches that email");
    expect(screen.queryByText("No account exists for this email")).toBeNull();
  });

  it("blocks reset submission when the two rendered passwords do not match", async () => {
    const user = userEvent.setup();
    render(<ResetPassword />);

    const passwordInputs = screen.getAllByDisplayValue("");
    await user.type(passwordInputs[0]!, "different-one");
    await user.type(passwordInputs[1]!, "different-two");
    fireEvent.submit(screen.getByRole("button", { name: "Update password" }).closest("form")!);

    expect(mocks.toastError).toHaveBeenCalledWith("Passwords do not match.");
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });
});
