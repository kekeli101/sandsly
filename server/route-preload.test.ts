import { describe, expect, it } from "vitest";
import { preloadRoute } from "../client/src/lib/route-preload";

describe("route intent preloading", () => {
  it("resolves the menu and staff route chunks before navigation", async () => {
    await expect(preloadRoute("/menu/boba")).resolves.toMatchObject({ default: expect.anything() });
    await expect(preloadRoute("/admin")).resolves.toMatchObject({ default: expect.anything() });
  });

  it("uses a safe fallback chunk for unknown paths", async () => {
    await expect(preloadRoute("/unknown-route")).resolves.toMatchObject({ default: expect.anything() });
  });
});
