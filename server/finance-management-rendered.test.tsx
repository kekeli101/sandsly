// @vitest-environment jsdom
import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createInventoryItem: vi.fn(),
  adjustInventory: vi.fn(),
  replaceRecipe: vi.fn(),
  createExpense: vi.fn(),
  financeInvalidate: vi.fn().mockResolvedValue(undefined),
  consoleInvalidate: vi.fn().mockResolvedValue(undefined),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  inventoryOptions: undefined as any,
}));

const financeSetup = {
  inventory: [{ id: 8, name: "Tapioca pearls", unit: "g" as const, currentQuantityMilliunits: 10_000, reorderPointMilliunits: 2_000, unitCostPesewas: 35, isActive: true }],
  recipes: [],
  products: [{ id: "matcha-cloud-boba", name: "Matcha Cloud Boba", isActive: true }],
  recentExpenses: [],
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ admin: { financeSetup: { invalidate: mocks.financeInvalidate }, console: { invalidate: mocks.consoleInvalidate } } }),
    admin: {
      financeSetup: { useQuery: () => ({ data: financeSetup, isLoading: false, isError: false, refetch: vi.fn(), isFetching: false }) },
      createInventoryItem: { useMutation: (options: any) => { mocks.inventoryOptions = options; return { mutate: mocks.createInventoryItem, isPending: false }; } },
      adjustInventory: { useMutation: () => ({ mutate: mocks.adjustInventory, isPending: false }) },
      replaceRecipe: { useMutation: () => ({ mutate: mocks.replaceRecipe, isPending: false }) },
      createExpense: { useMutation: () => ({ mutate: mocks.createExpense, isPending: false }) },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { error: mocks.toastError, success: mocks.toastSuccess } }));

import FinanceManagement from "../client/src/components/FinanceManagement";

const profit = { cogsPesewas: 0, inventoryWastePesewas: 0, directCostPesewas: 0, operatingExpensesPesewas: 0, isComplete: false, uncostedMenuRevenuePesewas: 45_000, lowStockCount: 1, inventoryValuePesewas: 350 };

describe("rendered Manager Console finance controls", () => {
  it("switches Stock, Recipes, and Expenses panels while keeping the empty-state safeguards visible", () => {
    render(<FinanceManagement isAdmin profit={profit} />);

    expect(screen.getByText("Add inventory")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Recipes" }));
    expect(screen.getByText("Set recipe cost")).toBeTruthy();
    expect(screen.getByText(/No recipes are recorded yet/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Expenses" }));
    expect(screen.getByText("Record expense")).toBeTruthy();
    expect(screen.getByText(/Supplier stock purchases belong under Stock/i)).toBeTruthy();
  });

  it("rejects incomplete inventory submission with visible feedback", () => {
    render(<FinanceManagement isAdmin profit={profit} />);

    fireEvent.click(screen.getByRole("button", { name: /Save inventory/i }));

    expect(mocks.createInventoryItem).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith(expect.stringMatching(/Enter a name, starting stock/i));
  });

  it("wires a valid inventory submission to the protected mutation and refreshes both report queries on success", async () => {
    const view = render(<FinanceManagement isAdmin profit={profit} />);
    const local = within(view.container);

    fireEvent.change(local.getByLabelText("Ingredient / stock item"), { target: { value: "Milk tea base" } });
    fireEvent.change(local.getByLabelText("Starting stock"), { target: { value: "12" } });
    fireEvent.change(local.getByLabelText("Reorder at"), { target: { value: "3" } });
    fireEvent.change(local.getByLabelText("Unit cost (GH₵)"), { target: { value: "1.25" } });
    fireEvent.click(local.getByRole("button", { name: /Save inventory/i }));

    expect(mocks.createInventoryItem).toHaveBeenCalledWith({ name: "Milk tea base", unit: "g", currentQuantityMilliunits: 12_000, reorderPointMilliunits: 3_000, unitCostPesewas: 125 });
    await act(async () => { await mocks.inventoryOptions.onSuccess(); });
    expect(mocks.financeInvalidate).toHaveBeenCalledTimes(1);
    expect(mocks.consoleInvalidate).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Inventory item recorded");
  });
});
