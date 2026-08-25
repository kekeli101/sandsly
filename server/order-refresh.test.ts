import { describe, expect, it } from "vitest";
import { getOrderRefreshInterval } from "../client/src/lib/order-refresh";

describe("customer order refresh policy", () => {
  it("polls only while an order can still progress", () => {
    expect(getOrderRefreshInterval([{ status: "preparing" }])).toBe(15_000);
    expect(getOrderRefreshInterval([{ status: "out_for_delivery" }], 5_000)).toBe(5_000);
  });

  it("stops background polling for empty or terminal-only order history", () => {
    expect(getOrderRefreshInterval(undefined)).toBe(false);
    expect(getOrderRefreshInterval([])).toBe(false);
    expect(getOrderRefreshInterval([{ status: "completed" }, { status: "delivered" }, { status: "cancelled" }])).toBe(false);
  });
});
