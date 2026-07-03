import { readFile } from "node:fs/promises";
import process from "node:process";
import pg from "pg";

const { Client } = pg;

async function readLocalEnv() {
  const raw = await readFile(".secrets/.env.local", "utf8");
  const values = new Map();

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) values.set(match[1].trim(), match[2].trim());
  }

  return values;
}

async function runSqlFile(client, filePath) {
  const sql = await readFile(filePath, "utf8");
  await client.query(sql);
  console.log(`Applied ${filePath}`);
}

const env = await readLocalEnv();
const connectionString = env.get("SUPABASE_DB_URL") || env.get("DATABASE_URL");

if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL or DATABASE_URL in .secrets/.env.local");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

try {
  await client.connect();
  await runSqlFile(client, "supabase/migrations/0001_initial_schema.sql");
  await runSqlFile(client, "supabase/migrations/0002_rls_membership_policies.sql");
  await runSqlFile(client, "supabase/seed.sql");
  console.log("Supabase migrations completed.");
} finally {
  await client.end();
}
