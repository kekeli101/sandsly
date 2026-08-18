import { describe, expect, it } from "vitest";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.SUPABASE_DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;

function getSupabaseProjectUrl(connectionString: string) {
  const hostname = new URL(connectionString).hostname;
  const match = hostname.match(/^db\.([a-z0-9-]+)\.supabase\.co$/i);
  if (!match?.[1]) throw new Error("SUPABASE_DATABASE_URL must use the direct db.<project-ref>.supabase.co hostname.");
  return `https://${match[1]}.supabase.co`;
}

describe.skipIf(!serviceRoleKey || (!databaseUrl && !supabaseUrl))("Supabase Storage service credential", () => {
  it("can list buckets with the server-only service key", async () => {
    const projectUrl = supabaseUrl?.replace(/\/$/, "") ?? getSupabaseProjectUrl(databaseUrl!);
    const response = await fetch(`${projectUrl}/storage/v1/bucket`, {
      headers: { apikey: serviceRoleKey!, authorization: `Bearer ${serviceRoleKey}` },
    });

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toEqual(expect.any(Array));
  }, 15_000);
});
