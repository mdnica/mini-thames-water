// server/db.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ The only database path we ever use
const DB_FILE = path.join(__dirname, "data.sqlite");
console.log("💾 Using database file:", DB_FILE);

const dbPromise = open({
  filename: DB_FILE,
  driver: sqlite3.Database,
});

export async function getDB() {
  return dbPromise;
}
