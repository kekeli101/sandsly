const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const RESEND_ONBOARDING_SENDER = "onboarding@resend.dev";

function normalizedAddress(value: string) {
  return value.trim().toLowerCase();
}

export function canDeliverPasswordResetEmail(email: string) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) return false;
  if (normalizedAddress(from) !== RESEND_ONBOARDING_SENDER) return true;
  const testRecipient = process.env.PASSWORD_RESET_TEST_RECIPIENT;
  return Boolean(testRecipient && normalizedAddress(email) === normalizedAddress(testRecipient));
}

function publicAppOrigin() {
  const configuredOrigin = process.env.FRONTEND_ORIGIN?.split(",")[0]?.trim();
  const fallbackOrigin = process.env.NODE_ENV === "production" ? "https://sandsly.vercel.app" : "http://localhost:3000";
  return new URL(configuredOrigin || fallbackOrigin).origin;
}

export function passwordResetUrl(token: string) {
  const url = new URL("/reset-password", publicAppOrigin());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendPasswordResetEmail(input: { email: string; token: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Password-reset email delivery is not configured");
  if (!canDeliverPasswordResetEmail(input.email)) throw new Error("Password-reset delivery is restricted to the verified testing recipient");

  const resetUrl = passwordResetUrl(input.token);
  const response = await fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: "Reset your Sandsly password",
      text: `We received a request to reset your Sandsly password. Use this link within 30 minutes: ${resetUrl}\n\nIf you did not request a reset, you can safely ignore this email.`,
      html: `<p>We received a request to reset your Sandsly password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request a reset, you can safely ignore this email.</p>`,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) throw new Error(`Password-reset email delivery failed with status ${response.status}`);
}
