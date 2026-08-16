import fs from "node:fs/promises";
import postgres from "postgres";

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) throw new Error("SUPABASE_DATABASE_URL is required");

const sql = postgres(connectionString, { prepare: false, max: 1 });
try {
  const seed = await fs.readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
  await sql.unsafe(seed);
  console.log("Supabase catalog seed applied");
} finally {
  await sql.end({ timeout: 5 });
}
