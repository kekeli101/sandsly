import { and, eq, gt, isNull } from "drizzle-orm";
import { passwordResetTokens, type User, users } from "../drizzle/schema";
import { getDb } from "./db";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function hasRecentPasswordResetRequest(userId: number, since: Date, now = new Date()) {
  const db = await requireDb();
  const rows = await db.select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.userId, userId),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.createdAt, since),
      gt(passwordResetTokens.expiresAt, now),
    ))
    .limit(1);
  return rows.length > 0;
}

export async function createPasswordResetRecord(input: { userId: number; tokenHash: string; expiresAt: Date }) {
  const db = await requireDb();
  const now = new Date();
  await db.transaction(async transaction => {
    await transaction.update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokens.userId, input.userId), isNull(passwordResetTokens.usedAt)));
    await transaction.insert(passwordResetTokens).values(input);
  });
}

export async function invalidatePasswordResetRecord(tokenHash: string) {
  const db = await requireDb();
  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)));
}

export async function resetPasswordFromToken(tokenHash: string, passwordHash: string): Promise<User | undefined> {
  const db = await requireDb();
  const now = new Date();
  return db.transaction(async transaction => {
    const [redeemedToken] = await transaction.update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ))
      .returning({ userId: passwordResetTokens.userId });

    if (!redeemedToken) return undefined;

    await transaction.update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokens.userId, redeemedToken.userId), isNull(passwordResetTokens.usedAt)));

    const [user] = await transaction.update(users)
      .set({ passwordHash, updatedAt: now, lastSignedIn: now })
      .where(eq(users.id, redeemedToken.userId))
      .returning();
    return user;
  });
}
