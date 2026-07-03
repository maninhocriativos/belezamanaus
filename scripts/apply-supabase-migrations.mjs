import { readdir, readFile } from "node:fs/promises";
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

function buildConnectionString(env) {
  const rawConnectionString = env.get("SUPABASE_DB_URL") || env.get("DATABASE_URL");
  const rawPassword = env.get("SUPABASE_DB_PASSWORD");

  if (!rawConnectionString) {
    return "";
  }

  if (!rawPassword) {
    return rawConnectionString;
  }

  const encodedPassword = encodeURIComponent(rawPassword);

  if (rawConnectionString.includes("[YOUR-PASSWORD]")) {
    return rawConnectionString.replace("[YOUR-PASSWORD]", encodedPassword);
  }

  if (rawConnectionString.includes("<YOUR-PASSWORD>")) {
    return rawConnectionString.replace("<YOUR-PASSWORD>", encodedPassword);
  }

  try {
    const url = new URL(rawConnectionString);
    url.password = encodedPassword;
    return url.toString();
  } catch {
    return rawConnectionString;
  }
}

const env = await readLocalEnv();
const connectionString = buildConnectionString(env);

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

  const migrationFiles = (await readdir("supabase/migrations"))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()
    .map((fileName) => `supabase/migrations/${fileName}`);

  for (const filePath of migrationFiles) {
    await runSqlFile(client, filePath);
  }

  await runSqlFile(client, "supabase/seed.sql");
  console.log("Supabase migrations completed.");
} finally {
  await client.end();
}
