import { createHash, randomBytes } from "node:crypto";

export const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 30;
export const PASSWORD_RESET_REQUEST_COOLDOWN_MS = 1000 * 60;

export function createPasswordResetToken(now = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(now + PASSWORD_RESET_TOKEN_TTL_MS),
  };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
