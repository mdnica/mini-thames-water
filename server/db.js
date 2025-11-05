import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Open a connection to the SQLite database
export async function getDB() {
  const db = await open({
    filename: "./data.sqlite", //database file path
    driver: sqlite3.Database,
  });
  return db;
}

