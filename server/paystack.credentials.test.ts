import { describe, expect, it } from "vitest";

describe("Paystack test credentials", () => {
  it("authorizes a read-only transaction-list request without exposing the secret", async () => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    expect(secretKey, "PAYSTACK_SECRET_KEY must be configured before enabling online checkout").toBeTruthy();
    expect(secretKey, "The Paystack rollout is intentionally restricted to test mode").toMatch(/^sk_test_/);

    const response = await fetch("https://api.paystack.co/transaction?perPage=1", {
      headers: { Authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.status, "Paystack must accept the configured test credential").not.toBe(401);
    expect(response.status, "Paystack must authorize the configured test credential").not.toBe(403);
    expect(response.ok, `Paystack credential check returned ${response.status}`).toBe(true);
  }, 15_000);
});
