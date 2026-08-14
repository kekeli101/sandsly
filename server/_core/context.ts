import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getDevelopmentDemoUser } from "../db";
import { DEMO_AUTH_HEADER, DEMO_SESSION_KEY, demoAuthEnabled } from "../demo-auth";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const demoHeader = opts.req.header(DEMO_AUTH_HEADER);
  if (demoAuthEnabled() && demoHeader === DEMO_SESSION_KEY) {
    // Deliberately development-only: production ignores this browser-controlled header entirely.
    user = await getDevelopmentDemoUser();
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
