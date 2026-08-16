import mysql from "mysql2/promise";
import postgres from "postgres";

const mysqlUrl = process.env.DATABASE_URL;
const postgresUrl = process.env.SUPABASE_DATABASE_URL;
if (!mysqlUrl) throw new Error("DATABASE_URL is required for the source database");
if (!postgresUrl) throw new Error("SUPABASE_DATABASE_URL is required for the destination database");

const source = await mysql.createConnection(mysqlUrl);
const destination = postgres(postgresUrl, { prepare: false, max: 1 });

const tables = [
  { name: "categories", columns: ["id", "slug", "name", "sortOrder", "isActive", "createdAt", "updatedAt"], conflict: '"id"' },
  { name: "users", columns: ["id", "openId", "name", "email", "passwordHash", "loginMethod", "role", "createdAt", "updatedAt", "lastSignedIn"], conflict: '"id"' },
  { name: "customerProfiles", columns: ["id", "userId", "phone", "defaultAddress", "createdAt", "updatedAt"], conflict: '"id"' },
  { name: "products", columns: ["id", "categoryId", "name", "description", "pricePesewas", "imageUrl", "badge", "crunchLevel", "sortOrder", "isActive", "createdAt", "updatedAt"], conflict: '"id"' },
  { name: "carts", columns: ["id", "userId", "createdAt", "updatedAt"], conflict: '"id"' },
  { name: "cartItems", columns: ["id", "cartId", "productId", "quantity", "createdAt", "updatedAt"], conflict: '"id"' },
  { name: "orders", columns: ["id", "orderNumber", "userId", "status", "currency", "subtotalPesewas", "deliveryFeePesewas", "totalPesewas", "customerNote", "createdAt", "updatedAt"], conflict: '"id"' },
  { name: "orderItems", columns: ["id", "orderId", "productId", "productName", "unitPricePesewas", "quantity", "lineTotalPesewas", "createdAt"], conflict: '"id"' },
];

function placeholders(rowCount, columnCount) {
  let parameter = 1;
  return Array.from({ length: rowCount }, () => `(${Array.from({ length: columnCount }, () => `$${parameter++}`).join(", ")})`).join(", ");
}

async function copyTable(table) {
  const [rows] = await source.query(`SELECT ${table.columns.map((column) => `\`${column}\``).join(", ")} FROM \`${table.name}\``);
  if (!rows.length) return 0;
  const values = rows.flatMap((row) => table.columns.map((column) => row[column]));
  const query = `INSERT INTO "${table.name}" (${table.columns.map((column) => `"${column}"`).join(", ")}) VALUES ${placeholders(rows.length, table.columns.length)} ON CONFLICT (${table.conflict}) DO NOTHING`;
  await destination.unsafe(query, values);
  return rows.length;
}

try {
  await destination.begin(async (transaction) => {
    for (const table of tables) {
      const [rows] = await source.query(`SELECT ${table.columns.map((column) => `\`${column}\``).join(", ")} FROM \`${table.name}\``);
      if (!rows.length) {
        console.log(`${table.name}: 0 rows`);
        continue;
      }
      const values = rows.flatMap((row) => table.columns.map((column) => row[column]));
      const query = `INSERT INTO "${table.name}" (${table.columns.map((column) => `"${column}"`).join(", ")}) VALUES ${placeholders(rows.length, table.columns.length)} ON CONFLICT (${table.conflict}) DO NOTHING`;
      await transaction.unsafe(query, values);
      console.log(`${table.name}: ${rows.length} rows copied`);
    }

    for (const table of ["users", "customerProfiles", "categories", "carts", "cartItems", "orders", "orderItems"]) {
      await transaction.unsafe(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), GREATEST(COALESCE(MAX("id"), 1), 1), true) FROM "${table}"`);
    }
  });
} finally {
  await source.end();
  await destination.end({ timeout: 5 });
}
