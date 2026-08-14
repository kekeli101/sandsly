import { describe, expect, it } from "vitest";
import { getKitchenProfileAccess } from "./kitchen-access";

describe("Kitchen Board profile access guidance", () => {
  it("shows the entry point only to kitchen/admin roles and guides customer accounts", () => {
    expect(getKitchenProfileAccess("kitchen")).toMatchObject({ canUseKitchen: true, guidance: null });
    expect(getKitchenProfileAccess("admin")).toMatchObject({ canUseKitchen: true, guidance: null });
    expect(getKitchenProfileAccess("user")).toEqual({
      canUseKitchen: false,
      description: "Kitchen Board access is limited to accounts assigned the Kitchen or Admin role.",
      guidance: "Ask an administrator to assign your account the Kitchen role.",
    });
  });
});
