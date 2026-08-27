import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("mobile responsive contracts", () => {
  it("keeps the account submit action inside the phone-sized form card", () => {
    const account = source("client/src/pages/Account.tsx");
    expect(account).toMatch(/<button type="submit" disabled=\{pending\} className="mt-5 inline-flex h-12 w-full items-center justify-center/);
    expect(account).toContain("text-base sm:[&_input]:text-sm");
  });

  it("stacks fulfillment choices and keeps checkout fields phone-safe", () => {
    const cart = source("client/src/pages/Cart.tsx");
    expect(cart).toContain('className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"');
    expect(cart).toContain("text-base sm:[&_input]:text-sm");
    expect(cart).toContain("text-base sm:[&_textarea]:text-sm");
  });

  it("stacks staff controls and finance forms before the small breakpoint", () => {
    const kitchen = source("client/src/pages/KitchenDashboard.tsx");
    const finance = source("client/src/components/FinanceManagement.tsx");
    expect(kitchen).toContain("h-10 w-full items-center justify-center");
    expect(kitchen).toContain("grid grid-cols-1 gap-3 sm:grid-cols-2");
    expect(finance).toContain("grid grid-cols-1 gap-3 sm:grid-cols-3");
    expect(finance).toContain("grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_92px_auto]");
  });
});
