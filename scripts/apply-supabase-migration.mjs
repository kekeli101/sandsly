import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const migrationFile = process.argv[2];
const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!migrationFile) throw new Error("Pass a migration file path");
if (!connectionString) throw new Error("SUPABASE_DATABASE_URL is required");

const migration = await fs.readFile(path.resolve(migrationFile), "utf8");
const statements = migration
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .filter(Boolean);
const sql = postgres(connectionString, { prepare: false, max: 1 });

try {
  for (const statement of statements) await sql.unsafe(statement);
  console.log(`Applied ${statements.length} statements from ${migrationFile}`);
} finally {
  await sql.end({ timeout: 5 });
}
