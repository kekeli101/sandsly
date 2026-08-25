import { isLazyImportFailure } from "../client/src/lib/lazy-import-recovery";
import { describe, expect, it } from "vitest";

describe("lazy import recovery", () => {
  it("recognizes stale hashed-chunk failures and keeps ordinary errors distinct", () => {
    expect(isLazyImportFailure(new TypeError("Failed to fetch dynamically imported module: /assets/Cart-old.js"))).toBe(true);
    expect(isLazyImportFailure(new Error("Importing a module script failed."))).toBe(true);
    expect(isLazyImportFailure(new Error("Order checkout failed"))).toBe(false);
  });
});
