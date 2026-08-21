import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createLocalUser, getUserByEmail, touchUser } from "../db";
import { createPasswordResetRecord, hasRecentPasswordResetRequest, invalidatePasswordResetRecord, resetPasswordFromToken } from "../password-reset-db";
import { canDeliverPasswordResetEmail, sendPasswordResetEmail } from "../password-reset-email";
import { createPasswordResetToken, hashPasswordResetToken, PASSWORD_RESET_REQUEST_COOLDOWN_MS } from "../password-reset";
import { clearSessionCookie, createSessionToken, hashPassword, normalizedEmail, publicUser, setSessionCookie, verifyPassword } from "../standalone-auth";
import { publicProcedure, router } from "../_core/trpc";

const emailAddress = z.string().trim().email();
const credentials = z.object({ email: emailAddress, password: z.string().min(8) });
const passwordResetRequest = z.object({ email: emailAddress });
const passwordResetCompletion = z.object({ token: z.string().min(32).max(256), password: z.string().min(8).max(256) });
const genericPasswordResetResponse = { accepted: true } as const;

export const standaloneAuthRouter = router({
  register: publicProcedure.input(credentials.extend({ name: z.string().trim().min(2).max(120) })).mutation(async ({ input, ctx }) => {
    const email = normalizedEmail(input.email);
    if (await getUserByEmail(email)) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
    const passwordHash = await hashPassword(input.password);
    const user = await createLocalUser({ openId: `local-${randomUUID()}`, name: input.name.trim(), email, passwordHash, loginMethod: "password", role: "user" });
    if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create account." });
    setSessionCookie(ctx.res, ctx.req, await createSessionToken(user));
    return publicUser(user);
  }),
  login: publicProcedure.input(credentials).mutation(async ({ input, ctx }) => {
    const user = await getUserByEmail(normalizedEmail(input.email));
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
    await touchUser(user.id);
    setSessionCookie(ctx.res, ctx.req, await createSessionToken(user));
    return publicUser(user);
  }),
  requestPasswordReset: publicProcedure.input(passwordResetRequest).mutation(async ({ input }) => {
    const user = await getUserByEmail(normalizedEmail(input.email));
    if (!user?.email || !user.passwordHash) return genericPasswordResetResponse;
    if (!canDeliverPasswordResetEmail(user.email)) return genericPasswordResetResponse;

    const isCoolingDown = await hasRecentPasswordResetRequest(user.id, new Date(Date.now() - PASSWORD_RESET_REQUEST_COOLDOWN_MS));
    if (isCoolingDown) return genericPasswordResetResponse;

    const { token, tokenHash, expiresAt } = createPasswordResetToken();
    await createPasswordResetRecord({ userId: user.id, tokenHash, expiresAt });
    try {
      await sendPasswordResetEmail({ email: user.email, token });
    } catch (error) {
      await invalidatePasswordResetRecord(tokenHash);
      console.error("[Auth] Password-reset email delivery failed", error instanceof Error ? error.message : "unknown error");
    }
    return genericPasswordResetResponse;
  }),
  resetPassword: publicProcedure.input(passwordResetCompletion).mutation(async ({ input, ctx }) => {
    const user = await resetPasswordFromToken(hashPasswordResetToken(input.token), await hashPassword(input.password));
    if (!user) throw new TRPCError({ code: "BAD_REQUEST", message: "This password-reset link is invalid or has expired." });
    setSessionCookie(ctx.res, ctx.req, await createSessionToken(user));
    return publicUser(user);
  }),
  logout: publicProcedure.mutation(({ ctx }) => {
    clearSessionCookie(ctx.res, ctx.req);
    return { success: true } as const;
  }),
});
