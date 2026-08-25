import { describe, expect, it } from "vitest";
import { getPrimaryOrderAction, isStorefrontRouteActive, storefrontNavigationItems } from "../client/src/lib/storefront-navigation";

describe("storefront side navigation", () => {
  it("exposes only ready customer destinations and keeps Rewards out of primary navigation", () => {
    expect(storefrontNavigationItems.map((item) => item.href)).toEqual(["/", "/menu", "/profile"]);
    expect(storefrontNavigationItems.some((item) => item.href === "/rewards")).toBe(false);
  });

  it("marks only the matching primary route as active", () => {
    expect(isStorefrontRouteActive("/", "/")).toBe(true);
    expect(isStorefrontRouteActive("/menu/pizza", "/menu")).toBe(true);
    expect(isStorefrontRouteActive("/rewards", "/menu")).toBe(false);
  });

  it("routes the persistent primary action to the bag only when it contains items", () => {
    expect(getPrimaryOrderAction(0)).toEqual({ destination: "/menu", label: "Order now" });
    expect(getPrimaryOrderAction(1)).toEqual({ destination: "/cart", label: "View bag" });
  });
});
