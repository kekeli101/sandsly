import { describe, expect, it } from "vitest";
import { filterCustomerCatalogProducts, isCustomerCatalogVisible } from "./catalog-utils";

describe("customer catalog visibility", () => {
  it("excludes inactive products and products in inactive categories", () => {
    const products = filterCustomerCatalogProducts([
      { product: { id: "live" }, productIsActive: true, categoryIsActive: true },
      { product: { id: "removed" }, productIsActive: false, categoryIsActive: true },
      { product: { id: "hidden-category" }, productIsActive: true, categoryIsActive: false },
    ]);
    expect(products).toEqual([{ id: "live" }]);
  });

  it("includes a product again immediately after it is restored", () => {
    expect(isCustomerCatalogVisible(false, true)).toBe(false);
    expect(isCustomerCatalogVisible(true, true)).toBe(true);
  });
});
