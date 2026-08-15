import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("auth.logout", () => {
  it("reports success for a standalone session logout", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {}, get: () => "https" } as unknown as TrpcContext["req"],
      res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
    };
    await expect(appRouter.createCaller(ctx).auth.logout()).resolves.toEqual({ success: true });
  });
});
