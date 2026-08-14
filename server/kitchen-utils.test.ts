import { describe, expect, it } from "vitest";
import { getKitchenActionLabel, isValidKitchenTransition } from "./kitchen-utils";

describe("kitchen status workflow", () => {
  it("allows only forward kitchen transitions and controlled cancellation", () => {
    expect(isValidKitchenTransition("pending", "accepted")).toBe(true);
    expect(isValidKitchenTransition("accepted", "preparing")).toBe(true);
    expect(isValidKitchenTransition("preparing", "ready")).toBe(true);
    expect(isValidKitchenTransition("ready", "completed")).toBe(true);
    expect(isValidKitchenTransition("pending", "cancelled")).toBe(true);
    expect(isValidKitchenTransition("preparing", "cancelled")).toBe(false);
    expect(isValidKitchenTransition("ready", "accepted")).toBe(false);
    expect(getKitchenActionLabel("preparing")).toBe("Mark ready");
  });
});
