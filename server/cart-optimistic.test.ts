import { describe, expect, it } from "vitest";
import { applyOptimisticAdd, rollbackOptimisticAdd } from "../client/src/lib/cart-optimistic";

const product = { id: "matcha-cloud-boba", name: "Matcha Cloud Boba", description: "Matcha", pricePesewas: 7500, imageUrl: "https://example.com/matcha.jpg", badge: null, crunchLevel: 2, categorySlug: "boba", categoryName: "Boba", sortOrder: 1 };

describe("optimistic cart additions", () => {
  it("increments the cart count and total immediately", () => {
    const cart = applyOptimisticAdd({ items: [], subtotalPesewas: 0, deliveryFeePesewas: 2000, totalPesewas: 2000 }, product);
    expect(cart.items).toEqual([expect.objectContaining({ id: product.id, quantity: 1 })]);
    expect(cart.subtotalPesewas).toBe(7500);
    expect(cart.totalPesewas).toBe(9500);
  });

  it("rolls back only the failed optimistic increment", () => {
    const once = applyOptimisticAdd(undefined, product);
    const twice = applyOptimisticAdd(once, product);
    expect(rollbackOptimisticAdd(twice, product.id)?.items[0]?.quantity).toBe(1);
    expect(rollbackOptimisticAdd(once, product.id)?.items).toEqual([]);
  });

  it("preserves a prior optimistic add when a later add fails", () => {
    const secondProduct = { ...product, id: "tiger-sugar-boba", name: "Tiger Sugar Boba", pricePesewas: 6500 };
    const first = applyOptimisticAdd(undefined, product);
    const withLaterPendingAdd = applyOptimisticAdd(first, secondProduct);
    expect(rollbackOptimisticAdd(withLaterPendingAdd, secondProduct.id)).toEqual(first);
  });
});
