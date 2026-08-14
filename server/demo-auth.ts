import { TRPCError } from "@trpc/server";
import { getDevelopmentDemoCustomer, getDevelopmentDemoUser } from "./db";

export const DEMO_AUTH_HEADER = "x-crunch-demo-user";
export const DEMO_SESSION_KEY = "crunch-demo-customer";
export const DEMO_CUSTOMER_SESSION_KEY = "crunch-demo-customer-test";
export const DEMO_USERNAME = "demo@crunchbite.local";
export const DEMO_PASSWORD = "Crunch!2026";

export function demoAuthEnabled() {
  return process.env.NODE_ENV !== "production";
}

export async function validateDemoLogin(username: string, password: string) {
  if (!demoAuthEnabled()) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Demo authentication is disabled." });
  }
  if (username.trim().toLowerCase() !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Use the development demo credentials shown below." });
  }
  const user = await getDevelopmentDemoUser();
  return { sessionKey: DEMO_SESSION_KEY, user };
}

export async function getDemoSessionUser(sessionKey: string) {
  if (!demoAuthEnabled()) return null;
  if (sessionKey === DEMO_SESSION_KEY) return getDevelopmentDemoUser();
  if (sessionKey === DEMO_CUSTOMER_SESSION_KEY) return getDevelopmentDemoCustomer();
  return null;
}
