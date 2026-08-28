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

  it("keeps Manager Console performance and payment sections within the viewport", () => {
    const admin = source("client/src/pages/AdminDashboard.tsx");
    expect(admin).toContain("overflow-x-hidden bg-[#111]");
    expect(admin).toContain("grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]");
    expect(admin).toContain('<div className="space-y-2 sm:hidden">');
    expect(admin).toContain('<div className="hidden overflow-x-auto sm:block">');
    expect(admin).toContain('<section className="mt-6 min-w-0 rounded-[20px]');
  });

  it("keeps the Manager Console date filter phone-safe and accessible", () => {
    const admin = source("client/src/pages/AdminDashboard.tsx");
    expect(admin).toContain('id="manager-report-day" type="date"');
    expect(admin).toContain('htmlFor="manager-report-day"');
    expect(admin).toContain("text-base font-bold");
    expect(admin).toContain("Showing all recorded days");
    expect(admin).toContain(">Clear</button>");
  });

  it("keeps reporting skeletons accessible and motion-reduction friendly", () => {
    const admin = source("client/src/pages/AdminDashboard.tsx");
    expect(admin).toContain('role="status" aria-live="polite" aria-label="Loading manager console report"');
    expect(admin).toContain("motion-reduce:animate-none");
    expect(admin).toContain('<SkeletonPanel eyebrow="Food performance" title="Top selling dishes">');
    expect(admin).toContain('<SkeletonPanel eyebrow="Payment ledger" title="Payment method & status">');
  });
});
