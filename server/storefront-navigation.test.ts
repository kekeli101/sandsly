import { describe, expect, it } from "vitest";
import { isStorefrontRouteActive, storefrontNavigationItems } from "../client/src/lib/storefront-navigation";

describe("storefront side navigation", () => {
  it("exposes the intended destinations, including the Rewards coming-soon route", () => {
    expect(storefrontNavigationItems.map((item) => item.href)).toEqual(["/", "/menu", "/rewards", "/profile"]);
  });

  it("marks only the matching primary route as active", () => {
    expect(isStorefrontRouteActive("/", "/")).toBe(true);
    expect(isStorefrontRouteActive("/menu/pizza", "/menu")).toBe(true);
    expect(isStorefrontRouteActive("/rewards", "/menu")).toBe(false);
  });
});
