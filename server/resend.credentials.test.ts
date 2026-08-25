import { describe, expect, it } from "vitest";

describe("Resend transactional-email credentials", () => {
  it("authenticates with Resend without exposing the API key", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const testRecipient = process.env.PASSWORD_RESET_TEST_RECIPIENT;
    expect(apiKey, "RESEND_API_KEY must be configured for password-reset delivery").toBeTruthy();
    expect(from, "RESEND_FROM_EMAIL must be configured for password-reset delivery").toBeTruthy();
    expect(testRecipient, "PASSWORD_RESET_TEST_RECIPIENT must be configured for restricted testing delivery").toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);

    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.status, "Resend must accept the configured API credential").not.toBe(401);
    expect(response.status, "Resend must authorize the configured API credential").not.toBe(403);
    expect(response.ok, `Resend domain check returned ${response.status}`).toBe(true);

    const payload = await response.json() as { data?: Array<{ name?: string; status?: string }> };
    const senderDomain = from?.split("@").pop()?.trim().toLowerCase();
    const configuredSenderIsVerified = payload.data?.some(domain => domain.name?.toLowerCase() === senderDomain && domain.status === "verified");
    const usingRestrictedOnboardingSender = from === "onboarding@resend.dev";
    expect(usingRestrictedOnboardingSender || configuredSenderIsVerified, "RESEND_FROM_EMAIL must use Resend’s restricted onboarding sender or a Resend-verified sending domain").toBe(true);
  }, 12_000);
});
