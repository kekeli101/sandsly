import { describe, expect, it } from "vitest";
import postgres from "postgres";

const connectionString = process.env.SUPABASE_DATABASE_URL;

describe.skipIf(!connectionString)("Supabase connection", () => {
  it("can execute a lightweight database query", async () => {
    const client = postgres(connectionString!, { prepare: false, max: 1, connect_timeout: 10 });
    try {
      const result = await client`select 1 as ok`;
      expect(result[0]?.ok).toBe(1);
    } finally {
      await client.end({ timeout: 5 });
    }
  }, 20_000);
});
