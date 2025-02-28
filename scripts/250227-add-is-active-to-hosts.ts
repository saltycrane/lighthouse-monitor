import "dotenv/config";

import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { getDatabasePath } from "../lib/env";

async function migrate() {
  console.log(
    "Starting migration to add is_active column to hosts table...",
  );

  const db = await open({
    filename: getDatabasePath(),
    driver: sqlite3.Database,
  });

  // Check if the column exists first to prevent errors
  const tableInfo = await db.all("PRAGMA table_info(hosts)");
  const columnExists = tableInfo.some((column) => column.name === "is_active");

  if (!columnExists) {
    // Add new column to hosts table with default value of TRUE
    await db.exec(`
      ALTER TABLE hosts ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    `);
    console.log("Added is_active column to hosts table");
  } else {
    console.log("Column is_active already exists in hosts table");
  }

  console.log("Migration completed successfully!");
}

migrate().catch(console.error);
