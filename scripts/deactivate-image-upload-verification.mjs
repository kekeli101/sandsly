import postgres from "postgres";

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) throw new Error("SUPABASE_DATABASE_URL is required to deactivate the temporary verification product.");

const sql = postgres(connectionString, { prepare: false, max: 1 });
try {
  const products = await sql`
    update "products"
    set "isActive" = false, "updatedAt" = now()
    where "name" = 'Image Upload Verification Dish' and "isActive" = true
    returning "id", "isActive"
  `;
  if (products.length !== 1) throw new Error(`Expected one active verification product, found ${products.length}.`);
  console.log(`Deactivated temporary verification product ${products[0].id}.`);
} finally {
  await sql.end({ timeout: 5 });
}
