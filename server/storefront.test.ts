import { describe, expect, it } from "vitest";
import { calculateOrderTotals } from "./storefront-utils";

describe("calculateOrderTotals", () => {
  it("calculates GHS pesewa totals without decimal rounding", () => {
    expect(calculateOrderTotals([
      { unitPricePesewas: 7500, quantity: 2 },
      { unitPricePesewas: 4500, quantity: 1 },
    ], 2000)).toEqual({
      subtotalPesewas: 19500,
      deliveryFeePesewas: 2000,
      totalPesewas: 21500,
    });
  });
});
