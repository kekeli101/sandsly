import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response } from "express";
import { parse as parseCookie } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../drizzle/schema";
import { getUserById } from "./db";

const scrypt = promisify(scryptCallback);
export const STANDALONE_SESSION_COOKIE = "sandsly_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const PASSWORD_MIN_LENGTH = 8;

function sessionSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is required in production");
  return new TextEncoder().encode(secret || "standalone-development-secret-change-me");
}

export function assertPassword(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
}

export async function hashPassword(password: string) {
  assertPassword(password);
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string | null | undefined) {
  if (!encoded?.startsWith("scrypt$")) return false;
  const [, saltHex, hashHex] = encoded.split("$");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createSessionToken(user: Pick<User, "id">) {
  return new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_TTL_MS) / 1000))
    .sign(sessionSecret());
}

export function setSessionCookie(res: Response, req: Request, token: string) {
  const secure = req.protocol === "https" || req.get("x-forwarded-proto") === "https";
  const crossSite = Boolean(process.env.FRONTEND_ORIGIN);
  res.cookie(STANDALONE_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: crossSite ? "none" : "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res: Response, req: Request) {
  const secure = req.protocol === "https" || req.get("x-forwarded-proto") === "https";
  const crossSite = Boolean(process.env.FRONTEND_ORIGIN);
  res.clearCookie(STANDALONE_SESSION_COOKIE, {
    httpOnly: true,
    sameSite: crossSite ? "none" : "lax",
    secure,
    path: "/",
  });
}

export async function getStandaloneUser(req: Request) {
  const token = parseCookie(req.headers.cookie ?? "")[STANDALONE_SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"] });
    const userId = Number(payload.userId);
    if (!Number.isInteger(userId)) return null;
    return (await getUserById(userId)) ?? null;
  } catch {
    return null;
  }
}

export function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

export function publicUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export const standalonePasswordRules = { minLength: PASSWORD_MIN_LENGTH } as const;
