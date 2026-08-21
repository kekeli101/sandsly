import { afterEach, describe, expect, it } from "vitest";
import { canDeliverPasswordResetEmail } from "./password-reset-email";

const originalFrom = process.env.RESEND_FROM_EMAIL;
const originalTestRecipient = process.env.PASSWORD_RESET_TEST_RECIPIENT;

afterEach(() => {
  process.env.RESEND_FROM_EMAIL = originalFrom;
  process.env.PASSWORD_RESET_TEST_RECIPIENT = originalTestRecipient;
});

describe("password-reset email delivery gate", () => {
  it("limits the Resend onboarding sender to its configured testing recipient", () => {
    process.env.RESEND_FROM_EMAIL = "onboarding@resend.dev";
    process.env.PASSWORD_RESET_TEST_RECIPIENT = "owner@example.com";

    expect(canDeliverPasswordResetEmail("OWNER@example.com")).toBe(true);
    expect(canDeliverPasswordResetEmail("customer@example.com")).toBe(false);
  });

  it("permits normal delivery only after a non-onboarding sender is configured", () => {
    process.env.RESEND_FROM_EMAIL = "support@verified-sandsly.example";
    process.env.PASSWORD_RESET_TEST_RECIPIENT = "owner@example.com";

    expect(canDeliverPasswordResetEmail("customer@example.com")).toBe(true);
  });
});
