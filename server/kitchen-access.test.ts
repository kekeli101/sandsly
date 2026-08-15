import { describe, expect, it } from "vitest";
import { getKitchenProfileAccess } from "../client/src/lib/kitchen-access";

describe("kitchen profile access", () => {
  it("hides kitchen access for normal and signed-out users", () => {
    expect(getKitchenProfileAccess("user").canUseKitchen).toBe(false);
    expect(getKitchenProfileAccess(undefined).canUseKitchen).toBe(false);
    expect(getKitchenProfileAccess(null).canUseKitchen).toBe(false);
  });

  it("allows kitchen and admin staff accounts", () => {
    expect(getKitchenProfileAccess("kitchen").canUseKitchen).toBe(true);
    expect(getKitchenProfileAccess("admin").canUseKitchen).toBe(true);
  });
});
