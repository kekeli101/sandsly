import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  createPasswordResetRecord: vi.fn(),
  hasRecentPasswordResetRequest: vi.fn(),
  invalidatePasswordResetRecord: vi.fn(),
  resetPasswordFromToken: vi.fn(),
  canDeliverPasswordResetEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  hashPassword: vi.fn(),
  createSessionToken: vi.fn(),
  createApiAccessToken: vi.fn(),
  setSessionCookie: vi.fn(),
}));

vi.mock("./db", () => ({ getUserByEmail: mocks.getUserByEmail, createLocalUser: vi.fn(), touchUser: vi.fn() }));
vi.mock("./password-reset-db", () => ({
  createPasswordResetRecord: mocks.createPasswordResetRecord,
  hasRecentPasswordResetRequest: mocks.hasRecentPasswordResetRequest,
  invalidatePasswordResetRecord: mocks.invalidatePasswordResetRecord,
  resetPasswordFromToken: mocks.resetPasswordFromToken,
}));
vi.mock("./password-reset-email", () => ({ canDeliverPasswordResetEmail: mocks.canDeliverPasswordResetEmail, sendPasswordResetEmail: mocks.sendPasswordResetEmail }));
vi.mock("./standalone-auth", () => ({
  clearSessionCookie: vi.fn(),
  createApiAccessToken: mocks.createApiAccessToken,
  createSessionToken: mocks.createSessionToken,
  hashPassword: mocks.hashPassword,
  normalizedEmail: (email: string) => email.trim().toLowerCase(),
  publicUser: (user: { passwordHash?: string | null; [key: string]: unknown }) => {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  },
  setSessionCookie: mocks.setSessionCookie,
  verifyPassword: vi.fn(),
}));

import { createPasswordResetToken, hashPasswordResetToken } from "./password-reset";
import { standaloneAuthRouter } from "./routers/auth";

const localUser = {
  id: 14,
  openId: "local-password-reset-user",
  name: "Customer",
  email: "customer@example.com",
  passwordHash: "scrypt$example",
  loginMethod: "password",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasRecentPasswordResetRequest.mockResolvedValue(false);
    mocks.createPasswordResetRecord.mockResolvedValue(undefined);
    mocks.invalidatePasswordResetRecord.mockResolvedValue(undefined);
    mocks.canDeliverPasswordResetEmail.mockReturnValue(true);
    mocks.sendPasswordResetEmail.mockResolvedValue(undefined);
    mocks.hashPassword.mockResolvedValue("scrypt$new-password");
    mocks.createSessionToken.mockResolvedValue("session-token");
    mocks.createApiAccessToken.mockResolvedValue("bounded-access-token");
  });

  it("generates a high-entropy reset secret and stores only its SHA-256 hash", () => {
    const reset = createPasswordResetToken(1_000);
    expect(reset.token).not.toEqual(reset.tokenHash);
    expect(reset.token).toHaveLength(43);
    expect(reset.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashPasswordResetToken(reset.token)).toBe(reset.tokenHash);
    expect(reset.expiresAt.getTime()).toBeGreaterThan(1_000);
  });

  it("returns the same acknowledgement for a known account and an unknown address", async () => {
    const caller = standaloneAuthRouter.createCaller(context());
    mocks.getUserByEmail.mockResolvedValueOnce(localUser).mockResolvedValueOnce(undefined);

    await expect(caller.requestPasswordReset({ email: " CUSTOMER@example.com " })).resolves.toEqual({ accepted: true });
    await expect(caller.requestPasswordReset({ email: "missing@example.com" })).resolves.toEqual({ accepted: true });
    expect(mocks.createPasswordResetRecord).toHaveBeenCalledTimes(1);
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it("silently rate-limits repeat recovery requests", async () => {
    mocks.getUserByEmail.mockResolvedValue(localUser);
    mocks.hasRecentPasswordResetRequest.mockResolvedValue(true);

    await expect(standaloneAuthRouter.createCaller(context()).requestPasswordReset({ email: localUser.email })).resolves.toEqual({ accepted: true });
    expect(mocks.createPasswordResetRecord).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("keeps restricted testing-only delivery generic without creating a usable reset token", async () => {
    mocks.getUserByEmail.mockResolvedValue(localUser);
    mocks.canDeliverPasswordResetEmail.mockReturnValue(false);

    await expect(standaloneAuthRouter.createCaller(context()).requestPasswordReset({ email: localUser.email })).resolves.toEqual({ accepted: true });
    expect(mocks.createPasswordResetRecord).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("keeps the acknowledgement generic and invalidates the unused token when delivery fails", async () => {
    mocks.getUserByEmail.mockResolvedValue(localUser);
    mocks.sendPasswordResetEmail.mockRejectedValue(new Error("sender not verified"));

    await expect(standaloneAuthRouter.createCaller(context()).requestPasswordReset({ email: localUser.email })).resolves.toEqual({ accepted: true });
    expect(mocks.invalidatePasswordResetRecord).toHaveBeenCalledTimes(1);
  });

  it("allows an immediate new request after a failed delivery invalidates the prior token", async () => {
    mocks.getUserByEmail.mockResolvedValue(localUser);
    mocks.sendPasswordResetEmail.mockRejectedValueOnce(new Error("temporary delivery failure")).mockResolvedValueOnce(undefined);
    mocks.hasRecentPasswordResetRequest.mockResolvedValue(false);
    const caller = standaloneAuthRouter.createCaller(context());

    await expect(caller.requestPasswordReset({ email: localUser.email })).resolves.toEqual({ accepted: true });
    await expect(caller.requestPasswordReset({ email: localUser.email })).resolves.toEqual({ accepted: true });

    expect(mocks.invalidatePasswordResetRecord).toHaveBeenCalledTimes(1);
    expect(mocks.createPasswordResetRecord).toHaveBeenCalledTimes(2);
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledTimes(2);
  });

  it("accepts only a valid unused reset token and starts a new session", async () => {
    mocks.resetPasswordFromToken.mockResolvedValue(localUser);
    const ctx = context();
    const result = await standaloneAuthRouter.createCaller(ctx).resetPassword({ token: "a".repeat(43), password: "fresh-password" });

    expect(mocks.hashPassword).toHaveBeenCalledWith("fresh-password");
    expect(mocks.resetPasswordFromToken).toHaveBeenCalledWith(hashPasswordResetToken("a".repeat(43)), "scrypt$new-password");
    expect(mocks.setSessionCookie).toHaveBeenCalledWith(ctx.res, ctx.req, "session-token");
    expect(mocks.createApiAccessToken).toHaveBeenCalledWith(localUser);
    expect(result).toMatchObject({ accessToken: "bounded-access-token", user: { email: localUser.email, role: "user" } });
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("rejects an invalid or expired reset token without starting a session", async () => {
    mocks.resetPasswordFromToken.mockResolvedValue(undefined);
    await expect(standaloneAuthRouter.createCaller(context()).resetPassword({ token: "b".repeat(43), password: "fresh-password" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.setSessionCookie).not.toHaveBeenCalled();
  });
});
